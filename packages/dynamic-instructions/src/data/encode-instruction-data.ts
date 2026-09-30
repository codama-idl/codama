import type { DataInput } from '@codama/dynamic-address-resolution';
import { getNodeValueCodec, type ReadonlyUint8Array } from '@codama/dynamic-codecs';
import { CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA, CodamaError, isCodamaError } from '@codama/errors';
import { getLastNodeFromPath, type InstructionNode, type NodePath } from 'codama';

/**
 * Create a function encoding the data of the instruction at the end of the
 * given path, e.g. `[root, program, instruction]`.
 *
 * Codama errors raised while encoding are thrown as is, e.g. a
 * `DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` error for a value of the wrong type or
 * an `INJECTED_VALUE_NOT_PROVIDED` error for a missing injected default value.
 * Other encoding errors, e.g. an integer out of range, throw a
 * `DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA` error whose cause is the original error.
 */
export function createInstructionDataEncoder<TData extends DataInput = DataInput>(
    path: NodePath<InstructionNode>,
): (data?: TData) => ReadonlyUint8Array {
    const codec = getNodeValueCodec(path);
    return data => {
        try {
            return codec.encode(data);
        } catch (error) {
            if (isCodamaError(error)) throw error;
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA, {
                cause: error,
                instructionName: getLastNodeFromPath(path).identifier,
            });
        }
    };
}

/**
 * Encode the data of the instruction at the end of the given path, see
 * {@link createInstructionDataEncoder}.
 *
 * @example
 * ```ts
 * const bytes = encodeInstructionData([root, program, transfer], { amount: 42n });
 * ```
 */
export function encodeInstructionData<TData extends DataInput = DataInput>(
    path: NodePath<InstructionNode>,
    data?: TData,
): ReadonlyUint8Array {
    return createInstructionDataEncoder<TData>(path)(data);
}
