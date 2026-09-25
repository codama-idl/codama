import {
    CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    CodamaError,
} from '@codama/errors';
import { camelCase } from '@codama/fragments/casing';
import {
    AccountValueNode,
    accountValueNode,
    constantPdaSeedNode,
    constantPdaSeedNodeFromBytes,
    constantPdaSeedNodeFromString,
    DataValueNode,
    dataValueNode,
    InstructionAccountNode,
    instructionAccountNode,
    integerTypeNode,
    integerValueNode,
    isNode,
    pdaNode,
    PdaSeedNode,
    PdaSeedValueNode,
    pdaSeedValueNode,
    PdaValueNode,
    pdaValueNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    StructFieldTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';

import { anchorRelationsPluginNode, docsFromAnchor, hex } from '../utils';
import { IdlV00Account, IdlV00AccountItem, IdlV00Pda, IdlV00Seed } from './idl';
import { pdaSeedTypeNodeFromAnchorV00 } from './PdaNode';

/**
 * Whether flattening nested account groups would produce accounts whose
 * identifiers collide under the casing-collision rule, in which case
 * nested accounts are prefixed by their group identifiers.
 */
function hasDuplicateAccountNames(idl: IdlV00AccountItem[]): boolean {
    const seenNames = new Set<string>();

    function checkDuplicates(items: IdlV00AccountItem[]): boolean {
        for (const item of items) {
            if ('accounts' in item) {
                if (checkDuplicates(item.accounts)) {
                    return true;
                }
            } else {
                const name = camelCase(item.name ?? '');
                if (seenNames.has(name)) {
                    return true;
                }
                seenNames.add(name);
            }
        }
        return false;
    }

    return checkDuplicates(idl);
}

export type InstructionAccountNodeFromAnchorV00Options = {
    /** The prefix of the accounts of the surrounding account group, if any. */
    prefix?: string;
    /**
     * The accounts of the same group that must hold this account's address
     * in their data, i.e. the `relations` of the IDL flipped to target it.
     */
    relations?: string[];
};

export function instructionAccountNodesFromAnchorV00(
    idl: IdlV00AccountItem[],
    dataFields: StructFieldTypeNode[] = [],
    options: Pick<InstructionAccountNodeFromAnchorV00Options, 'prefix'> = {},
): InstructionAccountNode[] {
    const { prefix } = options;
    const shouldPrefix = prefix !== undefined || hasDuplicateAccountNames(idl);
    const relationsByTarget = getRelationsByTarget(idl);

    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV00(account.accounts, dataFields, {
                  prefix: shouldPrefix ? (prefix ? `${prefix}_${account.name}` : account.name) : undefined,
              })
            : [
                  instructionAccountNodeFromAnchorV00(account, dataFields, {
                      prefix: shouldPrefix ? prefix : undefined,
                      relations: relationsByTarget.get(account.name) ?? [],
                  }),
              ],
    );
}

/**
 * Legacy IDLs list relations on the account declaring the `has_one`
 * constraint, whereas the `anchor.relations` plugin follows current IDLs
 * and lists them on the target account. Flip them within an account
 * group, ignoring targets that are not accounts of that group.
 */
function getRelationsByTarget(idl: IdlV00AccountItem[]): Map<string, string[]> {
    const relationsByTarget = new Map<string, string[]>();
    const accounts = idl.filter((item): item is IdlV00Account => !('accounts' in item));
    accounts.forEach(account => {
        (account.relations ?? []).forEach(target => {
            if (!accounts.some(candidate => candidate.name === target)) return;
            const relations = relationsByTarget.get(target) ?? [];
            if (!relations.includes(account.name)) relationsByTarget.set(target, [...relations, account.name]);
        });
    });
    return relationsByTarget;
}

/**
 * Convert a legacy Anchor instruction account, including its PDA default
 * value and its relations as an `anchor.relations` plugin.
 *
 * A PDA default value is only set when all of its seeds can be expressed
 * statically: nested account paths (e.g. `mint.authority`) require
 * fetching the account.
 */
export function instructionAccountNodeFromAnchorV00(
    idl: IdlV00Account,
    dataFields: StructFieldTypeNode[] = [],
    options: InstructionAccountNodeFromAnchorV00Options = {},
): InstructionAccountNode {
    const { prefix, relations = [] } = options;
    const withPrefix = (accountName: string) => (prefix ? `${prefix}_${accountName}` : accountName);
    const name = withPrefix(idl.name ?? '');

    return instructionAccountNode({
        defaultValue: idl.pda ? pdaDefaultValueFromAnchorV00(name, idl.pda, dataFields, withPrefix) : undefined,
        docs: docsFromAnchor(idl.docs) ?? (idl.desc || undefined),
        identifier: name,
        isOptional: idl.optional ?? idl.isOptional ?? false,
        isSigner: idl.isOptionalSigner ? 'either' : (idl.isSigner ?? false),
        isWritable: idl.isMut ?? false,
        plugins: anchorRelationsPluginNode(relations.map(withPrefix)),
    });
}

type SeedConversion = { definition: PdaSeedNode; value?: PdaSeedValueNode } | undefined;

function pdaDefaultValueFromAnchorV00(
    name: string,
    pda: IdlV00Pda,
    dataFields: StructFieldTypeNode[],
    withPrefix: (accountName: string) => string,
): PdaValueNode | undefined {
    const seeds = pda.seeds.map(seed => pdaSeedNodeFromAnchorV00(seed, dataFields, withPrefix));
    if (seeds.some(seed => seed === undefined)) return undefined;

    let programId: string | undefined;
    let programIdValue: AccountValueNode | DataValueNode | undefined;
    if (pda.programId !== undefined) {
        const seed = pda.programId;
        if (seed.kind === 'const' && seed.type === 'publicKey' && typeof seed.value === 'string') {
            programId = seed.value;
        } else {
            const value = seed.kind === 'const' ? undefined : pdaSeedNodeFromAnchorV00(seed, dataFields, withPrefix);
            if (!value?.value || !isNode(value.value.value, ['accountValueNode', 'dataValueNode'])) return undefined;
            programIdValue = value.value.value;
        }
    }

    return pdaValueNode(pdaNode({ identifier: name, programId, seeds: seeds.map(seed => seed!.definition) }), {
        programId: programIdValue,
        seeds: seeds.flatMap(seed => (seed!.value ? [seed!.value] : [])),
    });
}

function pdaSeedNodeFromAnchorV00(
    seed: IdlV00Seed,
    dataFields: StructFieldTypeNode[],
    withPrefix: (accountName: string) => string,
): SeedConversion {
    const kind = seed.kind;
    switch (kind) {
        case 'const':
            return constantPdaSeedNodeFromAnchorV00(seed.type, seed.value);
        case 'account': {
            if (seed.path.includes('.')) return undefined;
            const accountName = withPrefix(seed.path);
            return {
                definition: variablePdaSeedNode(accountName, publicKeyTypeNode()),
                value: pdaSeedValueNode(accountName, accountValueNode(accountName)),
            };
        }
        case 'arg': {
            // Legacy seeds carry their type, so nested paths need not be walked.
            const path = seed.path.split('.');
            if (!dataFields.some(({ identifier }) => identifier === path[0])) {
                throw new CodamaError(CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: path[0] });
            }
            const seedName = path.join('_');
            return {
                definition: variablePdaSeedNode(seedName, pdaSeedTypeNodeFromAnchorV00(seed.type)),
                value: pdaSeedValueNode(seedName, dataValueNode(seed.path)),
            };
        }
        default:
            throw new CodamaError(CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
    }
}

const INTEGER_SEED_TYPES = ['u8', 'u16', 'u32', 'u64', 'u128', 'i8', 'i16', 'i32', 'i64', 'i128'] as const;

/** Convert a legacy constant seed, whose raw JSON value depends on its type. */
function constantPdaSeedNodeFromAnchorV00(type: IdlV00Seed['type'], value: unknown): SeedConversion {
    if (type === 'string' && typeof value === 'string') {
        return { definition: constantPdaSeedNodeFromString('utf8', value) };
    }
    if (type === 'publicKey' && typeof value === 'string') {
        return { definition: constantPdaSeedNode(publicKeyTypeNode(), publicKeyValueNode(value)) };
    }
    if (Array.isArray(value) && value.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
        return { definition: constantPdaSeedNodeFromBytes('base16', hex(value as number[])) };
    }
    const integerType = INTEGER_SEED_TYPES.find(format => format === type);
    if (integerType && (typeof value === 'number' || typeof value === 'string') && /^-?\d+$/.test(String(value))) {
        return {
            definition: constantPdaSeedNode(integerTypeNode(integerType), integerValueNode(BigInt(value).toString())),
        };
    }
    return undefined;
}
