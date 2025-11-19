import {
    CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    CodamaError,
} from '@codama/errors';
import {
    accountValueNode,
    argumentValueNode,
    constantPdaSeedNodeFromBytes,
    InstructionArgumentNode,
    PdaSeedNode,
    PdaSeedValueNode,
    pdaSeedValueNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { getBase58Codec } from '@solana/codecs';

import { IdlV01Seed } from './idl';

export function pdaSeedNodeFromAnchorV01(
    seed: IdlV01Seed,
    instructionArguments: InstructionArgumentNode[],
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
            return {
                definition: variablePdaSeedNode(accountName, publicKeyTypeNode()),
                value: pdaSeedValueNode(accountName, accountValueNode(accountName)),
            };
        }
        case 'arg': {
            // Ignore nested paths.
            const [argumentName] = seed.path.split('.');
            const argumentNode = instructionArguments.find(({ name }) => name === argumentName);
            if (!argumentNode) {
                throw new CodamaError(CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: argumentName });
            }
            return {
                definition: variablePdaSeedNode(argumentName, argumentNode.type),
                value: pdaSeedValueNode(argumentName, argumentValueNode(argumentName)),
            };
        }
        default:
            throw new CodamaError(CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
    }
}
