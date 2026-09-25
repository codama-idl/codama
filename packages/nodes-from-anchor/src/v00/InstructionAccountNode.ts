import { CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, CodamaError } from '@codama/errors';
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
import { getBase58Codec } from '@solana/codecs';

import {
    anchorRelationsPluginNode,
    DefinedTypeMap,
    docsFromAnchor,
    haveSameCamelCase,
    hex,
    isDefined,
    resolveFieldPath,
} from '../utils';
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
    /**
     * The names of the accounts of the surrounding account group, as they
     * appear in the IDL, used to resolve account seeds. When absent, account
     * seed paths are used as is.
     */
    accountNames?: string[];
    /** The program's defined types, used to follow links within nested argument paths. */
    definedTypes?: DefinedTypeMap;
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
    options: Pick<InstructionAccountNodeFromAnchorV00Options, 'definedTypes' | 'prefix'> = {},
): InstructionAccountNode[] {
    const { prefix } = options;
    const shouldPrefix = prefix !== undefined || hasDuplicateAccountNames(idl);
    const accountNames = idl.filter(item => !('accounts' in item)).map(item => item.name);
    const relationsByTarget = getRelationsByTarget(idl);

    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV00(account.accounts, dataFields, {
                  ...options,
                  prefix: shouldPrefix ? (prefix ? `${prefix}_${account.name}` : account.name) : undefined,
              })
            : [
                  instructionAccountNodeFromAnchorV00(account, dataFields, {
                      ...options,
                      accountNames,
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
 *
 * Relations keep the Rust casing (e.g. `my_account`) whereas account names
 * are camelCased (e.g. `myAccount`), so they are matched by camelCase form.
 */
function getRelationsByTarget(idl: IdlV00AccountItem[]): Map<string, string[]> {
    const relationsByTarget = new Map<string, string[]>();
    const accounts = idl.filter((item): item is IdlV00Account => !('accounts' in item));
    accounts.forEach(account => {
        (account.relations ?? []).forEach(relation => {
            const target = accounts.find(candidate => haveSameCamelCase(candidate.name, relation));
            if (!target) return;
            const relations = relationsByTarget.get(target.name) ?? [];
            if (!relations.includes(account.name)) relationsByTarget.set(target.name, [...relations, account.name]);
        });
    });
    return relationsByTarget;
}

/**
 * Convert a legacy Anchor instruction account, including its PDA default
 * value and its relations as an `anchor.relations` plugin.
 *
 * Legacy IDLs camelCase argument and account names but keep the Rust
 * casing in seed paths (e.g. `seed_a` for the `seedA` argument), so seeds
 * are matched by camelCase form. A PDA default value is only set when all
 * of its seeds can be expressed statically and resolved: nested account
 * paths (e.g. `mint.authority`) require fetching the account.
 */
export function instructionAccountNodeFromAnchorV00(
    idl: IdlV00Account,
    dataFields: StructFieldTypeNode[] = [],
    options: InstructionAccountNodeFromAnchorV00Options = {},
): InstructionAccountNode {
    const { prefix, relations = [] } = options;
    const withPrefix = (accountName: string) => (prefix ? `${prefix}_${accountName}` : accountName);
    const name = withPrefix(idl.name ?? '');
    const context: SeedContext = {
        dataFields,
        definedTypes: options.definedTypes ?? new Map(),
        resolveAccount: seedPath => {
            if (!options.accountNames) return withPrefix(seedPath);
            const account = options.accountNames.find(candidate => haveSameCamelCase(candidate, seedPath));
            return account === undefined ? undefined : withPrefix(account);
        },
    };

    return instructionAccountNode({
        defaultValue: idl.pda ? pdaDefaultValueFromAnchorV00(name, idl.pda, context) : undefined,
        docs: docsFromAnchor(idl.docs) ?? (idl.desc || undefined),
        identifier: name,
        isOptional: idl.optional ?? idl.isOptional ?? false,
        isSigner: idl.isOptionalSigner ? 'either' : (idl.isSigner ?? false),
        isWritable: idl.isMut ?? false,
        plugins: anchorRelationsPluginNode(relations.map(withPrefix)),
    });
}

type SeedContext = {
    dataFields: StructFieldTypeNode[];
    definedTypes: DefinedTypeMap;
    /** The identifier of the instruction account a seed path refers to, if any. */
    resolveAccount: (seedPath: string) => string | undefined;
};

type SeedConversion = { definition: PdaSeedNode; value?: PdaSeedValueNode };

function pdaDefaultValueFromAnchorV00(name: string, pda: IdlV00Pda, context: SeedContext): PdaValueNode | undefined {
    const seeds = pda.seeds.map(seed => pdaSeedNodeFromAnchorV00(seed, context));
    if (!seeds.every(isDefined)) return undefined;

    let programId: string | undefined;
    let programIdValue: AccountValueNode | DataValueNode | undefined;
    if (pda.programId !== undefined) {
        const seed = pda.programId;
        if (seed.kind === 'const') {
            programId = constantProgramIdFromAnchorV00(seed.type, seed.value);
            if (programId === undefined) return undefined;
        } else {
            const conversion = pdaSeedNodeFromAnchorV00(seed, context);
            const programIdNode = conversion?.value?.value;
            if (!programIdNode || !isNode(programIdNode, ['accountValueNode', 'dataValueNode'])) return undefined;
            programIdValue = programIdNode;
        }
    }

    return pdaValueNode(pdaNode({ identifier: name, programId, seeds: seeds.map(seed => seed.definition) }), {
        programId: programIdValue,
        seeds: seeds.flatMap(seed => (seed.value ? [seed.value] : [])),
    });
}

/** A constant program ID, given as an address or as its 32 bytes. */
function constantProgramIdFromAnchorV00(type: IdlV00Seed['type'], value: unknown): string | undefined {
    if (type === 'publicKey' && typeof value === 'string') return value;
    if (isByteArray(value) && value.length === 32) return getBase58Codec().decode(new Uint8Array(value));
    return undefined;
}

function pdaSeedNodeFromAnchorV00(seed: IdlV00Seed, context: SeedContext): SeedConversion | undefined {
    const kind = seed.kind;
    switch (kind) {
        case 'const':
            return constantPdaSeedNodeFromAnchorV00(seed.type, seed.value);
        case 'account': {
            if (seed.path.includes('.')) return undefined;
            const accountName = context.resolveAccount(seed.path);
            if (accountName === undefined) return undefined;
            return {
                definition: variablePdaSeedNode(accountName, publicKeyTypeNode()),
                value: pdaSeedValueNode(accountName, accountValueNode(accountName)),
            };
        }
        case 'arg': {
            // Legacy seeds carry their type, so only the identifiers of the path are resolved.
            const resolution = resolveFieldPath(
                context.dataFields,
                seed.path.split('.'),
                context.definedTypes,
                haveSameCamelCase,
            );
            if (resolution.kind !== 'found') return undefined;
            const seedName = resolution.path.join('_');
            return {
                definition: variablePdaSeedNode(seedName, pdaSeedTypeNodeFromAnchorV00(seed.type)),
                value: pdaSeedValueNode(seedName, dataValueNode(resolution.path.join('.'))),
            };
        }
        default:
            throw new CodamaError(CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
    }
}

const INTEGER_SEED_TYPES = ['u8', 'u16', 'u32', 'u64', 'u128', 'i8', 'i16', 'i32', 'i64', 'i128'] as const;

/** Convert a legacy constant seed, whose raw JSON value depends on its type. */
function constantPdaSeedNodeFromAnchorV00(type: IdlV00Seed['type'], value: unknown): SeedConversion | undefined {
    if (type === 'string' && typeof value === 'string') {
        return { definition: constantPdaSeedNodeFromString('utf8', value) };
    }
    if (type === 'publicKey' && typeof value === 'string') {
        return { definition: constantPdaSeedNode(publicKeyTypeNode(), publicKeyValueNode(value)) };
    }
    if (isByteArray(value)) {
        return { definition: constantPdaSeedNodeFromBytes('base16', hex(value)) };
    }
    const integerType = INTEGER_SEED_TYPES.find(format => format === type);
    if (integerType && (typeof value === 'number' || typeof value === 'string') && /^-?\d+$/.test(String(value))) {
        return {
            definition: constantPdaSeedNode(integerTypeNode(integerType), integerValueNode(BigInt(value).toString())),
        };
    }
    return undefined;
}

function isByteArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255);
}
