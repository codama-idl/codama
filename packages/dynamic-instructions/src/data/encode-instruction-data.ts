import type { DataInput } from '@codama/dynamic-address-resolution';
import { getNodeValueCodec, type ReadonlyUint8Array } from '@codama/dynamic-codecs';
import { CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA, CodamaError, isCodamaError } from '@codama/errors';
import {
    getLinkablesFromNode,
    type InstructionNode,
    type LinkableDictionary,
    type NodePath,
    type StructFieldTypeNode,
} from 'codama';

/** Options of the functions returned by {@link createInstructionDataEncoder}. */
export type EncodeInstructionDataOptions = {
    /**
     * The default values of data fields resolved beforehand, used instead of evaluating them,
     * e.g. those injected from account data. See `resolveInstructionDataDefaultValues` in
     * `@codama/dynamic-address-resolution`.
     */
    resolvedDefaultValues?: ReadonlyMap<StructFieldTypeNode, unknown>;
};

/**
 * Create a function encoding the data of the instruction at the end of the
 * given path, e.g. `[root, program, instruction]`. Its links are followed using
 * the linkable nodes of the tree, recorded once from its root unless given.
 *
 * Codama errors raised while encoding are thrown as is, e.g. a
 * `DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE` error for a value of the wrong type or
 * an `INJECTED_VALUE_NOT_PROVIDED` error for a missing injected default value.
 * Other encoding errors, e.g. an integer out of range, throw a
 * `DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA` error whose cause is the original error.
 *
 * Default values injected from contextual values, e.g. account data, cannot be evaluated while
 * encoding: provide them through the `resolvedDefaultValues` option. The encoder then creates a
 * codec for these values, since they differ from one instruction to the next.
 *
 * @example
 * ```ts
 * const encode = createInstructionDataEncoder([root, program, transfer]);
 * const bytes = encode({ amount: 42n });
 * ```
 */
export function createInstructionDataEncoder<TData extends DataInput = DataInput>(
    path: NodePath<InstructionNode>,
    linkables: LinkableDictionary = getLinkablesFromNode(path[0]),
): (data?: TData, options?: EncodeInstructionDataOptions) => ReadonlyUint8Array {
    const getCodec = (resolvedDefaultValues?: ReadonlyMap<StructFieldTypeNode, unknown>) =>
        getNodeValueCodec(path, { linkables, resolvedDefaultValues });
    const codec = getCodec();
    return (data, { resolvedDefaultValues } = {}) => {
        try {
            const dataCodec =
                resolvedDefaultValues && resolvedDefaultValues.size > 0 ? getCodec(resolvedDefaultValues) : codec;
            return dataCodec.encode(data);
        } catch (error) {
            if (isCodamaError(error)) throw error;
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA, {
                cause: error,
                path,
            });
        }
    };
}

/**
 * Encode the data of the instruction at the end of the given path, see
 * {@link createInstructionDataEncoder}. It creates the codec on each call: use
 * `createInstructionDataEncoder` to encode several times.
 *
 * @example
 * ```ts
 * const bytes = encodeInstructionData([root, program, transfer], { amount: 42n });
 * ```
 */
export function encodeInstructionData<TData extends DataInput = DataInput>(
    path: NodePath<InstructionNode>,
    data?: TData,
    options: EncodeInstructionDataOptions & { linkables?: LinkableDictionary } = {},
): ReadonlyUint8Array {
    const { linkables, ...encodeOptions } = options;
    return createInstructionDataEncoder<TData>(path, linkables)(data, encodeOptions);
}
