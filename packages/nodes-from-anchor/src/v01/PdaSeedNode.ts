import {
    CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    CodamaError,
} from '@codama/errors';
import {
    accountValueNode,
    constantPdaSeedNodeFromBytes,
    dataValueNode,
    PdaSeedNode,
    PdaSeedValueNode,
    pdaSeedValueNode,
    publicKeyTypeNode,
    StructFieldTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { getBase58Codec } from '@solana/codecs';

import { DefinedTypeMap, getFieldPathType, removeBorshSizePrefix } from '../utils';
import { IdlV01Seed } from './idl';

export type PdaSeedNodeFromAnchorV01Options = {
    /** The program's defined types, used to follow links within nested argument paths. */
    definedTypes?: DefinedTypeMap;
    /** The prefix of the accounts of the surrounding account group, if any. */
    prefix?: string;
};

/**
 * Convert an Anchor PDA seed into a PDA seed definition and, for variable
 * seeds, the value it takes within the instruction.
 *
 * Nested argument paths (e.g. `params.seed`) resolve to a `dataValueNode`
 * pointing to that path. Returns `undefined` when the seed cannot be
 * expressed statically: nested account paths (e.g. `mint.authority`)
 * require fetching the account, and nested argument paths must go
 * through structs.
 */
export function pdaSeedNodeFromAnchorV01(
    seed: IdlV01Seed,
    dataFields: StructFieldTypeNode[],
    options: PdaSeedNodeFromAnchorV01Options = {},
): Readonly<{ definition: PdaSeedNode; value?: PdaSeedValueNode }> | undefined {
    const { definedTypes = new Map(), prefix } = options;
    const kind = seed.kind;

    switch (kind) {
        case 'const':
            return {
                definition: constantPdaSeedNodeFromBytes('base58', getBase58Codec().decode(new Uint8Array(seed.value))),
            };
        case 'account': {
            if (seed.path.includes('.')) return undefined;
            const accountName = prefix ? `${prefix}_${seed.path}` : seed.path;
            return {
                definition: variablePdaSeedNode(accountName, publicKeyTypeNode()),
                value: pdaSeedValueNode(accountName, accountValueNode(accountName)),
            };
        }
        case 'arg': {
            const path = seed.path.split('.');
            if (!dataFields.some(({ identifier }) => identifier === path[0])) {
                throw new CodamaError(CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: path[0] });
            }
            const type = getFieldPathType(dataFields, path, definedTypes);
            if (!type) return undefined;

            // Anchor uses unprefixed strings and byte arrays for PDA seeds
            // even though the arguments themselves are Borsh size-prefixed.
            const seedName = path.join('_');
            return {
                definition: variablePdaSeedNode(seedName, removeBorshSizePrefix(type)),
                value: pdaSeedValueNode(seedName, dataValueNode(path.join('.'))),
            };
        }
        default:
            throw new CodamaError(CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
    }
}
