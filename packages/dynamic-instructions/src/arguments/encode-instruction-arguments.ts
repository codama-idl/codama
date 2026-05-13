import {
    type ArgumentsInput,
    createCodecInputTransformer,
    createDefaultValueEncoderVisitor,
    DEFAULT_VALUE_ENCODER_SUPPORTED_NODE_KINDS,
} from '@codama/dynamic-address-resolution';
import { getNodeCodec, type ReadonlyUint8Array } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__DEFAULT_VALUE_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_ARGUMENT,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CodamaError,
} from '@codama/errors';
import { type Codec, mergeBytes } from '@solana/codecs';
import type { InstructionNode, RootNode } from 'codama';
import { visitOrElse } from 'codama';

import { isOmittedArgument, isOptionalArgument } from './shared';

/**
 * Encodes all instruction arguments into a single byte array.
 * Iterates over each InstructionArgumentNode and encodes based on its category:
 *
 * Omitted arguments use their default value.
 * Optional arguments are encoded as null.
 * Required arguments are transformed from user input and then encoded.
 */
export function encodeInstructionArguments<TArgs extends ArgumentsInput = ArgumentsInput>(
    root: RootNode,
    ix: InstructionNode,
    argumentsInput?: TArgs,
): ReadonlyUint8Array {
    const chunks = ix.arguments.map(ixArgumentNode => {
        const input = argumentsInput?.[ixArgumentNode.name];
        const nodeCodec = getNodeCodec([root, root.program, ix, ixArgumentNode]);
        if (isOmittedArgument(ixArgumentNode)) {
            return encodeOmittedArgument(ix, ixArgumentNode, nodeCodec);
        } else if (isOptionalArgument(ixArgumentNode, input)) {
            return encodeOptionalArgument(ix, ixArgumentNode, nodeCodec);
        } else {
            return encodeRequiredArgument(root, ix, ixArgumentNode, input, nodeCodec);
        }
    });

    return mergeBytes(chunks.map(chunk => Uint8Array.from(chunk)));
}

function encodeOmittedArgument(
    ix: InstructionNode,
    ixArgumentNode: InstructionNode['arguments'][number],
    nodeCodec: Codec<unknown>,
): ReadonlyUint8Array {
    const defaultValue = ixArgumentNode.defaultValue;
    if (defaultValue === undefined) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__DEFAULT_VALUE_MISSING, {
            argumentName: ixArgumentNode.name,
            instructionName: ix.name,
        });
    }

    const visitor = createDefaultValueEncoderVisitor(nodeCodec);
    return visitOrElse(defaultValue, visitor, node => {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: [...DEFAULT_VALUE_ENCODER_SUPPORTED_NODE_KINDS],
            kind: node.kind,
            node,
        });
    });
}

function encodeOptionalArgument(
    ix: InstructionNode,
    ixArgumentNode: InstructionNode['arguments'][number],
    nodeCodec: Codec<unknown>,
): ReadonlyUint8Array {
    try {
        return nodeCodec.encode(null);
    } catch (error) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_ARGUMENT, {
            argumentName: ixArgumentNode.name,
            cause: error,
            instructionName: ix.name,
        });
    }
}

function encodeRequiredArgument(
    root: RootNode,
    ix: InstructionNode,
    ixArgumentNode: InstructionNode['arguments'][number],
    input: ArgumentsInput[string],
    nodeCodec: Codec<unknown>,
): ReadonlyUint8Array {
    if (input === undefined) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ARGUMENT_MISSING, {
            argumentName: ixArgumentNode.name,
            instructionName: ix.name,
        });
    }

    const transformer = createCodecInputTransformer(ixArgumentNode.type, root, {
        bytesEncoding: 'base16',
    });
    const transformedInput = transformer(input);
    try {
        return nodeCodec.encode(transformedInput);
    } catch (error) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_ARGUMENT, {
            argumentName: ixArgumentNode.name,
            cause: error,
            instructionName: ix.name,
        });
    }
}
