import {
    CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND,
    CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND,
    CodamaError,
} from '@codama/errors';
import {
    assertIsNode,
    instructionAccountNode,
    InstructionAccountNodeInput,
    InstructionInputValueNode,
    InstructionNode,
    instructionNode,
    InstructionNodeInput,
    Node,
    ProvidedNode,
    providedNode,
    StructFieldTypeNodeInput,
    ValueNode,
    VALUE_NODES,
} from '@codama/nodes';
import { getLastNodeFromPath, LinkableDictionary, NodePath, visit } from '@codama/visitors-core';

import { fillDefaultPdaSeedValuesVisitor } from './fillDefaultPdaSeedValuesVisitor';
import {
    applyDataUpdates,
    assertValidUpdateKeys,
    createUpdateResolver,
    getAppliedUpdate,
    getRenames,
    getUpdateTransformer,
    getUpdateVisitor,
    identifierOrUndefined,
    mergeUpdateRecords,
    UpdateEntry,
} from './updateHelpers';

export type InstructionUpdates = AppliedInstructionUpdates | { delete: true };
type AppliedInstructionUpdates = Partial<Omit<InstructionNodeInput, 'accounts' | 'data' | 'provides'>> & {
    /** Updates the instruction's accounts, keyed by account identifier. */
    accounts?: InstructionAccountUpdates;
    /** Updates the fields of the instruction's inline `data`, keyed by path (e.g. `amount` or `config.fee`). */
    data?: InstructionDataUpdates;
    /** Adds or replaces (or removes, with `null`) the instruction's provided nodes, keyed by identifier. */
    provides?: Record<string, Node | null>;
};

export type InstructionAccountUpdates = Record<
    string,
    Partial<Omit<InstructionAccountNodeInput, 'defaultValue'>> & {
        /** The new default value of the account, or `null` to remove it. */
        defaultValue?: InstructionInputValueNode | null;
    }
>;

export type InstructionDataUpdates = Record<
    string,
    Partial<Omit<StructFieldTypeNodeInput, 'defaultValue'>> & {
        /**
         * The new default value of the field, or `null` to remove it.
         * Contextual defaults (e.g. an account's bump) are expressed with an
         * `injectedValueNode` whose key is provided by the instruction.
         */
        defaultValue?: ValueNode | null;
    }
>;

const INSTRUCTION_UPDATE_KEYS = [
    'accounts',
    'byteDeltas',
    'data',
    'discriminators',
    'display',
    'docs',
    'identifier',
    'optionalAccountStrategy',
    'plugins',
    'provides',
    'remainingAccounts',
    'status',
    'subInstructions',
];
const INSTRUCTION_ACCOUNT_UPDATE_KEYS = [
    'accountLink',
    'defaultValue',
    'display',
    'docs',
    'identifier',
    'isOptional',
    'isSigner',
    'isWritable',
    'plugins',
];
const INSTRUCTION_DATA_UPDATE_KEYS = [
    'defaultValue',
    'defaultValueStrategy',
    'display',
    'docs',
    'identifier',
    'plugins',
    'type',
];

/**
 * Update or delete instructions, keyed by `NodeSelector`s such as
 * instruction identifiers (matched exactly), optionally prefixed by a
 * program identifier.
 *
 * - `accounts` updates existing instruction accounts. A new PDA default
 *   value gets its missing seeds filled from the instruction's accounts and
 *   data (see `fillDefaultPdaSeedValuesVisitor`).
 * - `data` updates existing fields of the instruction's inline `data`,
 *   addressed by path. Fields behind a defined type link cannot be updated
 *   since the type may be shared: unwrap it first.
 * - `provides` is merged by identifier with the instruction's provided nodes.
 *
 * Updates from every entry matching an instruction are merged and applied
 * at once, keyed by the original identifiers of its accounts and data
 * fields. Nodes supplied by the updates (e.g. default values or provided
 * nodes) must use the new identifiers since they refer to the updated
 * instruction: they are not repointed.
 *
 * Renames are propagated to every reference: renaming the instruction
 * renames the `instructionLinkNode`s pointing to it, renaming an account
 * repoints the `accountValueNode`, `accountBumpValueNode`,
 * `accountDataValueNode`, `instructionAccountLinkNode` and
 * `${accounts.…}` references to it, and renaming a data field repoints the
 * `dataValueNode`, `fieldDiscriminatorNode` and `${data.…}` references going
 * through it.
 *
 * @throws {CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS} if an update
 * contains an unrecognised key (e.g. `name` instead of `identifier`).
 * @throws {CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND} if an
 * updated account does not exist.
 * @throws {CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND} if an
 * updated data field does not exist or sits behind a defined type link.
 * @throws {CODAMA_ERROR__UNEXPECTED_NODE_KIND} if a data field's default
 * value is not a `ValueNode`.
 *
 * @example
 * ```ts
 * updateInstructionsVisitor({
 *     create: {
 *         accounts: { payer: { defaultValue: payerValueNode() } },
 *         data: {
 *             'config.fee': { identifier: 'feeBps' },
 *             bump: { defaultValue: injectedValueNode({ key: 'bump' }) },
 *         },
 *         provides: { bump: accountBumpValueNode('pda') },
 *     },
 *     legacyInstruction: { delete: true },
 * });
 * ```
 */
export function updateInstructionsVisitor(map: Record<string, InstructionUpdates>) {
    const entries = Object.entries(map).map(([selector, updates]): UpdateEntry<AppliedInstructionUpdates> => {
        assertValidInstructionUpdates(selector, updates);
        return { select: ['[instructionNode]', selector], updates };
    });
    const resolve = createUpdateResolver(entries, (previous, next) => ({
        ...previous,
        ...next,
        accounts: mergeUpdateRecords(previous.accounts, next.accounts),
        data: mergeUpdateRecords(previous.data, next.data),
        provides: previous.provides || next.provides ? { ...previous.provides, ...next.provides } : undefined,
    }));
    const linkables = new LinkableDictionary();

    const transformer = getUpdateTransformer('instructionNode', resolve, (node, updates, path) => {
        assertUpdatedAccountsExist(getLastNodeFromPath(path), updates);
        const updated = updateInstructionShape(node, getLastNodeFromPath(path), updates);
        return fillNewDefaultValues(updated, updates, [...path.slice(0, -1), updated], linkables);
    });

    return getUpdateVisitor([transformer], {
        linkables,
        renames: {
            instructionAccounts: path => getRenames(getAppliedUpdate(resolve(path))?.accounts),
            instructionFields: path => getRenames(getAppliedUpdate(resolve(path))?.data),
            instructions: path => identifierOrUndefined(getAppliedUpdate(resolve(path))?.identifier),
        },
    });
}

function assertValidInstructionUpdates(selector: string, updates: InstructionUpdates): void {
    if ('delete' in updates) {
        assertValidUpdateKeys(selector, updates, ['delete']);
        return;
    }
    assertValidUpdateKeys(selector, updates, INSTRUCTION_UPDATE_KEYS);
    Object.entries(updates.accounts ?? {}).forEach(([account, accountUpdates]) => {
        assertValidUpdateKeys(`${selector}.accounts.${account}`, accountUpdates, INSTRUCTION_ACCOUNT_UPDATE_KEYS);
    });
    Object.entries(updates.data ?? {}).forEach(([path, fieldUpdates]) => {
        assertValidUpdateKeys(`${selector}.data.${path}`, fieldUpdates, INSTRUCTION_DATA_UPDATE_KEYS);
        if (fieldUpdates.defaultValue) assertIsNode(fieldUpdates.defaultValue, VALUE_NODES);
    });
}

/** Ensure every updated account exists on the original instruction. */
function assertUpdatedAccountsExist(instruction: InstructionNode, updates: AppliedInstructionUpdates): void {
    Object.keys(updates.accounts ?? {}).forEach(accountName => {
        if (!(instruction.accounts ?? []).some(account => account.identifier === accountName)) {
            throw new CodamaError(CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND, {
                accountName,
                instruction,
                instructionName: instruction.identifier,
            });
        }
    });
}

/**
 * Apply every update but the new account default values: metadata,
 * accounts (removing defaults set to `null`), data fields and provided
 * nodes.
 */
function updateInstructionShape(
    node: InstructionNode,
    original: InstructionNode,
    updates: AppliedInstructionUpdates,
): InstructionNode {
    const { accounts: accountUpdates = {}, data: dataUpdates = {}, provides, ...otherUpdates } = updates;

    const { type: data, unusedPaths } = applyDataUpdates(node.data, dataUpdates);
    if (unusedPaths.length > 0) {
        throw new CodamaError(CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND, {
            instruction: original,
            instructionName: original.identifier,
            path: unusedPaths[0],
        });
    }

    return instructionNode({
        ...node,
        ...otherUpdates,
        accounts: (node.accounts ?? []).map(account => {
            const accountUpdate = accountUpdates[account.identifier];
            if (!accountUpdate) return account;
            const { defaultValue, ...otherAccountUpdates } = accountUpdate;
            return instructionAccountNode({
                ...account,
                ...otherAccountUpdates,
                defaultValue: defaultValue === null ? undefined : account.defaultValue,
            });
        }),
        data,
        provides: provides ? mergeProvides(node.provides ?? [], provides) : node.provides,
    });
}

/**
 * Set the new account default values on the updated instruction, filling
 * the missing seeds of PDA values against it: new default values refer to
 * the instruction's new accounts and data fields.
 */
function fillNewDefaultValues(
    instruction: InstructionNode,
    updates: AppliedInstructionUpdates,
    instructionPath: NodePath<InstructionNode>,
    linkables: LinkableDictionary,
): InstructionNode {
    const newDefaultValues = new Map(
        Object.entries(updates.accounts ?? {}).flatMap(([accountName, { defaultValue, identifier }]) =>
            defaultValue ? [[identifier ?? accountName, defaultValue] as const] : [],
        ),
    );
    if (newDefaultValues.size === 0) return instruction;

    const fillSeeds = fillDefaultPdaSeedValuesVisitor(instructionPath, linkables);
    return instructionNode({
        ...instruction,
        accounts: (instruction.accounts ?? []).map(account => {
            const defaultValue = newDefaultValues.get(account.identifier);
            return defaultValue
                ? instructionAccountNode({ ...account, defaultValue: visit(defaultValue, fillSeeds) })
                : account;
        }),
    });
}

function mergeProvides(provides: ProvidedNode[], updates: Record<string, Node | null>): ProvidedNode[] {
    const merged = [...provides];
    Object.entries(updates).forEach(([identifier, value]) => {
        const index = merged.findIndex(provided => provided.identifier === identifier);
        if (value === null) {
            if (index >= 0) merged.splice(index, 1);
        } else if (index >= 0) {
            merged[index] = providedNode(identifier, value, { ...merged[index] });
        } else {
            merged.push(providedNode(identifier, value));
        }
    });
    return merged;
}
