import {
    CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
    CodamaError,
} from '@codama/errors';
import { Node } from '@codama/nodes';
import { Codec, Encoder, getBase16Decoder, transformCodec } from '@solana/codecs';

/** Describe the type of a value in error messages, e.g. `number (1.5)` or `array (length 2)`. */
export function formatValueType(value: unknown): string {
    if (value === null) return 'null';
    if (typeof value === 'number') return `number (${value})`;
    if (value instanceof Uint8Array) return `Uint8Array (length ${value.length})`;
    if (Array.isArray(value)) return `array (length ${value.length})`;
    return typeof value;
}

/**
 * Whether the value is a plain object, e.g. the value of a struct or a map. Other
 * objects, such as arrays, bytes, `Map`s or `Date`s, are rejected since their
 * entries are not their own enumerable properties.
 */
export function isObjectRecord(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) return false;
    const prototype = Object.getPrototypeOf(value) as unknown;
    return prototype === Object.prototype || prototype === null;
}

/** The error thrown when the node at the end of `nodePath` cannot encode the given value. */
export function getUnexpectedValueTypeError(
    nodePath: readonly Node[],
    expectedType: string,
    value: unknown,
): CodamaError {
    return new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
        actualType: formatValueType(value),
        expectedType,
        nodeKind: nodePath[nodePath.length - 1].kind,
        nodePath,
    });
}

/**
 * Reject the values the check does not accept before encoding them, since
 * encoders may otherwise silently encode them, e.g. `'abc'` as a `u16` zero.
 */
export function assertValueType(
    codec: Codec<unknown>,
    nodePath: readonly Node[],
    expectedType: string,
    isValid: (value: unknown) => boolean,
): Codec<unknown> {
    return transformCodec(codec, (value: unknown) => {
        if (!isValid(value)) throw getUnexpectedValueTypeError(nodePath, expectedType, value);
        return value;
    });
}

/**
 * Reject the items of a set that encode to the same bytes, since sets hold
 * unique values. Comparing encoded bytes works for any item type, e.g. structs
 * or tuples, and accounts for encoded default values.
 *
 * Each item is encoded once more for the check, and variable-size codecs run it
 * twice (when sizing and when writing), a cost accepted for its simplicity.
 */
export function assertUniqueItems(items: readonly unknown[], item: Encoder<unknown>, nodePath: readonly Node[]): void {
    const base16 = getBase16Decoder();
    const indices = new Map<string, number>();
    items.forEach((itemValue: unknown, index) => {
        const key = base16.decode(item.encode(itemValue));
        const firstIndex = indices.get(key);
        if (firstIndex !== undefined) {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM, { firstIndex, index, nodePath });
        }
        indices.set(key, index);
    });
}
