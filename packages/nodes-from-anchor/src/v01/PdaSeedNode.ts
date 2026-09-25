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

import { removeBorshSizePrefix } from '../utils';
import { IdlV01Seed } from './idl';

export function pdaSeedNodeFromAnchorV01(
    seed: IdlV01Seed,
    dataFields: StructFieldTypeNode[],
    prefix?: string,
): Readonly<{ definition: PdaSeedNode; value?: PdaSeedValueNode }> {
    const kind = seed.kind;

    switch (kind) {
        case 'const':
            return {
                definition: constantPdaSeedNodeFromBytes('base58', getBase58Codec().decode(new Uint8Array(seed.value))),
            };
        case 'account': {
            // Ignore nested paths.
            const [accountName] = seed.path.split('.');
            const prefixedAccountName = prefix ? `${prefix}_${accountName}` : accountName;
            return {
                definition: variablePdaSeedNode(prefixedAccountName, publicKeyTypeNode()),
                value: pdaSeedValueNode(prefixedAccountName, accountValueNode(prefixedAccountName)),
            };
        }
        case 'arg': {
            // Ignore nested paths.
            const [argumentName] = seed.path.split('.');
            const field = dataFields.find(({ identifier }) => identifier === argumentName);
            if (!field) {
                throw new CodamaError(CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: argumentName });
            }

            // Anchor uses unprefixed strings and byte arrays for PDA seeds
            // even though the arguments themselves are Borsh size-prefixed.
            return {
                definition: variablePdaSeedNode(field.identifier, removeBorshSizePrefix(field.type)),
                value: pdaSeedValueNode(field.identifier, dataValueNode(field.identifier)),
            };
        }
        default:
            throw new CodamaError(CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
    }
}
