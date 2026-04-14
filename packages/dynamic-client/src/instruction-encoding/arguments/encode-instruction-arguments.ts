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

import type { ArgumentsInput } from '../../shared/types';
import {
    createDefaultValueEncoderVisitor,
    createInputValueTransformer,
    DEFAULT_VALUE_ENCODER_SUPPORTED_NODE_KINDS,
} from '../visitors';
import { isOmittedArgument, isOptionalArgument } from './shared';

/**
 * Encodes all instruction arguments into a single byte array.
 * Iterates over each InstructionArgumentNode and encodes based on its category:
 *
 * Omitted arguments use their default value.
 * Optional arguments are encoded as null.
 * Required arguments are transformed from user input and then encoded.
 */
export function encodeInstructionArguments(
    root: RootNode,
    ix: InstructionNode,
    argumentsInput: ArgumentsInput = {},
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

    return mergeBytes(chunks as Uint8Array[]);
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

    const transformer = createInputValueTransformer(ixArgumentNode.type, root, {
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
