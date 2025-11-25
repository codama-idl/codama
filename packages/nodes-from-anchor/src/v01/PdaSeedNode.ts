import {
    CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING,
    CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED,
    CodamaError,
} from '@codama/errors';
import {
    accountValueNode,
    argumentValueNode,
    camelCase,
    constantPdaSeedNodeFromBytes,
    InstructionArgumentNode,
    isNode,
    PdaSeedNode,
    PdaSeedValueNode,
    pdaSeedValueNode,
    publicKeyTypeNode,
    stringTypeNode,
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
            const [originalArgumentName] = seed.path.split('.');
            const argumentName = camelCase(originalArgumentName);
            const argumentNode = instructionArguments.find(({ name }) => name === argumentName);
            if (!argumentNode) {
                throw new CodamaError(CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: originalArgumentName });
            }

            // Anchor uses unprefixed strings for PDA seeds even though the
            // argument itself uses a Borsh size-prefixed string. Thus, we
            // must recognize this case and convert the type accordingly.
            const isBorshString =
                isNode(argumentNode.type, 'sizePrefixTypeNode') &&
                isNode(argumentNode.type.type, 'stringTypeNode') &&
                argumentNode.type.type.encoding === 'utf8' &&
                isNode(argumentNode.type.prefix, 'numberTypeNode') &&
                argumentNode.type.prefix.format === 'u32';
            const argumentType = isBorshString ? stringTypeNode('utf8') : argumentNode.type;

            return {
                definition: variablePdaSeedNode(argumentNode.name, argumentType),
                value: pdaSeedValueNode(argumentNode.name, argumentValueNode(argumentNode.name)),
            };
        }
        default:
            throw new CodamaError(CODAMA_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED, { kind });
    }
}
