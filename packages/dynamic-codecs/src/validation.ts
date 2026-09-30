import { CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, CodamaError } from '@codama/errors';
import { Node } from '@codama/nodes';
import { Codec, transformCodec } from '@solana/codecs';

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
