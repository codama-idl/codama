import { CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    accountLinkNode,
    AccountNode,
    accountNode,
    AccountNodeInput,
    assertIsNode,
    IdentifierString,
    identifierString,
    PdaLinkNode,
    pdaLinkNode,
    pdaNode,
    PdaSeedNode,
    programNode,
} from '@codama/nodes';
import {
    BottomUpNodeTransformerWithSelector,
    findProgramNodeFromPath,
    getLastNodeFromPath,
    LinkableDictionary,
    NodePath,
} from '@codama/visitors-core';

import { renameStructNode } from './renameHelpers';
import {
    assertValidUpdateKeys,
    createUpdateResolver,
    getAppliedUpdate,
    getUpdateTransformer,
    getUpdateVisitor,
    identifierOrUndefined,
    RenamePlan,
    toRenameMap,
    UpdateEntry,
} from './updateHelpers';

export type AccountUpdates = AppliedAccountUpdates | { delete: true };
type AppliedAccountUpdates = Partial<Omit<AccountNodeInput, 'data'>> & {
    /** Renames the top-level fields of the account's data, from old to new identifier. */
    data?: Record<string, string>;
    /** Creates or updates the PDA of the account with these seeds. */
    seeds?: PdaSeedNode[];
};

const ACCOUNT_UPDATE_KEYS = ['data', 'discriminators', 'docs', 'identifier', 'pda', 'plugins', 'seeds', 'size'];

/**
 * A PDA to create or update: its (new) identifier, the original identifier
 * of the program it lives in, its seeds, and the PDA link the account must
 * now use, if it changes.
 */
type PdaUpsert = { identifier: IdentifierString; link?: PdaLinkNode; program: IdentifierString; seeds: PdaSeedNode[] };

/**
 * Update or delete accounts, keyed by `NodeSelector`s such as account
 * identifiers (matched exactly), optionally prefixed by a program identifier.
 *
 * Renames are propagated to every reference:
 * - renaming an account renames every `accountLinkNode` pointing to it, as
 *   well as the PDA of the same program sharing its identifier, if any, and
 *   the `pdaLinkNode`s pointing to that PDA;
 * - renaming the fields of the account's data (`data`) repoints every path
 *   going through them, e.g. its `fieldDiscriminatorNode`s and the
 *   `accountDataValueNode`s of instruction accounts linked to it.
 *
 * Providing `seeds` updates the PDA of the account (the one given by `pda`,
 * the one it links to, or else one sharing its identifier) or creates it
 * and links the account to it.
 *
 * @throws {CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS} if an update
 * contains an unrecognised key (e.g. `name` instead of `identifier`).
 * @throws {CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND} if `data`
 * renames a field that does not exist.
 * @throws {CODAMA_ERROR__UNEXPECTED_NODE_KIND} if `data` renames fields of
 * an account whose data is not an inline struct.
 *
 * @example
 * ```ts
 * updateAccountsVisitor({
 *     'splToken.mint': { identifier: 'tokenMint', data: { mintAuthority: 'authority' } },
 *     metadata: { seeds: [constantPdaSeedNodeFromString('utf8', 'metadata')] },
 *     legacyAccount: { delete: true },
 * });
 * ```
 */
export function updateAccountsVisitor(map: Record<string, AccountUpdates>) {
    const entries = Object.entries(map).map(([selector, updates]): UpdateEntry<AppliedAccountUpdates> => {
        assertValidUpdateKeys(selector, updates, 'delete' in updates ? ['delete'] : ACCOUNT_UPDATE_KEYS);
        return { select: ['[accountNode]', selector], updates };
    });
    const resolve = createUpdateResolver(entries, (previous, next) => ({
        ...previous,
        ...next,
        data: { ...previous.data, ...next.data },
    }));
    const linkables = new LinkableDictionary();
    const renames: RenamePlan = {
        accountFields: path => toRenameMap(getAppliedUpdate(resolve(path))?.data),
        accounts: path => identifierOrUndefined(getAppliedUpdate(resolve(path))?.identifier),
        // The PDA sharing the identifier of a renamed account, in the same program, is renamed too.
        pdas: path => {
            const accountPath = linkables.getPath([...path, accountLinkNode(getLastNodeFromPath(path).identifier)]);
            return accountPath ? renames.accounts?.(accountPath) : undefined;
        },
    };
    const getPdaUpsert = (accountPath: NodePath<AccountNode>) =>
        getPdaUpsertOfAccount(accountPath, getAppliedUpdate(resolve(accountPath)), renames, linkables);

    const accountTransformer = getUpdateTransformer('accountNode', resolve, (node, updates, path) => {
        // `seeds` is not an account attribute: the constructor ignores it.
        const { data: fieldRenames = {}, ...otherUpdates } = updates;
        return accountNode({
            ...node,
            ...otherUpdates,
            data: renameAccountFields(node, getLastNodeFromPath(path), fieldRenames),
            pda: getPdaUpsert(path)?.link ?? otherUpdates.pda ?? node.pda,
        });
    });

    // Each program applies the PDA upserts targeting it, computed from the
    // recorded accounts, so upserts across programs need no shared state.
    const programTransformer: BottomUpNodeTransformerWithSelector = {
        select: '[programNode]',
        transform: (node, stack) => {
            assertIsNode(node, 'programNode');
            const program = getLastNodeFromPath(stack.getPath('programNode')).identifier;
            const upserts = linkables
                .getRecordedPathsOfKind('accountNode')
                .map(getPdaUpsert)
                .filter((upsert): upsert is PdaUpsert => upsert?.program === program);
            if (upserts.length === 0) return node;
            const pdas = [...(node.pdas ?? [])];
            upserts.forEach(({ identifier, seeds }) => {
                const index = pdas.findIndex(pda => pda.identifier === identifier);
                if (index < 0) pdas.push(pdaNode({ identifier, seeds }));
                else pdas[index] = pdaNode({ ...pdas[index], seeds });
            });
            return programNode({ ...node, pdas });
        },
    };

    const pdaTransformer: BottomUpNodeTransformerWithSelector = {
        select: '[pdaNode]',
        transform: (node, stack) => {
            assertIsNode(node, 'pdaNode');
            const newIdentifier = renames.pdas?.(stack.getPath('pdaNode'));
            return newIdentifier ? pdaNode({ ...node, identifier: newIdentifier }) : node;
        },
    };

    return getUpdateVisitor([accountTransformer, pdaTransformer, programTransformer], { linkables, renames });
}

/** Rename the top-level fields of an account's inline struct data, checked against the original account. */
function renameAccountFields(
    node: AccountNode,
    original: AccountNode,
    fieldRenames: Record<string, string>,
): AccountNode['data'] {
    if (Object.keys(fieldRenames).length === 0) return node.data;
    assertIsNode(original.data, 'structTypeNode');
    const fields = new Set<string>((original.data.fields ?? []).map(field => field.identifier));
    const missingField = Object.keys(fieldRenames).find(field => !fields.has(field));
    if (missingField !== undefined) {
        throw new CodamaError(CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND, {
            account: original,
            missingField: identifierString(missingField),
            name: original.identifier,
        });
    }
    assertIsNode(node.data, 'structTypeNode');
    return renameStructNode(node.data, fieldRenames);
}

/**
 * The PDA to create or update for an original account given its updates,
 * if they provide `seeds`: the PDA given by `pda`, the one the account
 * already links to, or else a new one named after the account.
 */
function getPdaUpsertOfAccount(
    accountPath: NodePath<AccountNode>,
    updates: AppliedAccountUpdates | undefined,
    renames: RenamePlan,
    linkables: LinkableDictionary,
): PdaUpsert | undefined {
    const program = findProgramNodeFromPath(accountPath);
    if (!updates?.seeds || !program) return undefined;
    const { pda: newPda, seeds } = updates;
    const account = getLastNodeFromPath(accountPath);

    if (newPda) {
        const pdaProgram = newPda.program?.identifier ?? program.identifier;
        return { identifier: identifierString(newPda.identifier), link: newPda, program: pdaProgram, seeds };
    }

    if (account.pda) {
        // The existing link is repointed like any other reference.
        const pdaPath = linkables.getPath([...accountPath, account.pda]);
        const pdaProgram = (pdaPath ? findProgramNodeFromPath(pdaPath) : undefined) ?? program;
        const identifier = (pdaPath ? renames.pdas?.(pdaPath) : undefined) ?? account.pda.identifier;
        return { identifier, program: pdaProgram.identifier, seeds };
    }

    const identifier = renames.accounts?.(accountPath) ?? account.identifier;
    return { identifier, link: pdaLinkNode(identifier), program: program.identifier, seeds };
}
