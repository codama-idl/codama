import {
    type Encoder,
    getBase16Encoder,
    getBase58Encoder,
    getBase64Encoder,
    getUtf8Encoder,
    type ReadonlyUint8Array,
} from '@solana/codecs';
import type { BytesEncoding, NodeKind } from 'codama';

/**
 * Checks if a value is a plain object record (struct-like).
 */
export function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

/** Returns the `NodeKind` of a node or `null`. */
export function getMaybeNodeKind(node: unknown): NodeKind | null {
    if (!isObjectRecord(node)) return null;
    return (node as { kind: NodeKind }).kind ?? null;
}

/** Formats the type of a given value as a string. */
export function formatValueType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return `array (length ${value.length})`;
    if (value instanceof Uint8Array) return `Uint8Array (length ${value.length})`;
    if (typeof value === 'object') return 'object';
    return typeof value;
}

/**
 * Serializes a value for use in error messages and diagnostic output.
 * Converts BigInt to strings, always returns a string and never throws.
 */
export function safeStringify(value: unknown): string {
    try {
        return JSON.stringify(value, (_key, v: unknown) => (typeof v === 'bigint' ? String(v) : v));
    } catch {
        return `non-serializable ${formatValueType(value)}`;
    }
}

/**
 * Whether a user-provided value equals a value decoded from a value node,
 * e.g. to evaluate conditions. Integers compare by value whether they are
 * numbers or bigints, enum variants compare by `__kind` and `data` whether
 * they are objects or identifiers, and arrays and objects compare deeply.
 */
export function isValueEqual(actual: unknown, expected: unknown): boolean {
    if (isInteger(actual) && isInteger(expected)) return BigInt(actual) === BigInt(expected);
    // Bytes compare by content, whether they are raw bytes or `[encoding, data]` tuples.
    const actualBytes = getBytes(actual);
    const expectedBytes = getBytes(expected);
    if (actualBytes && expectedBytes) {
        return actualBytes.length === expectedBytes.length && actualBytes.every((byte, i) => byte === expectedBytes[i]);
    }
    if (typeof actual === 'string' && isEnumVariantValue(expected)) {
        return expected.data === undefined && actual === expected.__kind;
    }
    if (Array.isArray(actual) && Array.isArray(expected)) {
        return actual.length === expected.length && actual.every((item, index) => isValueEqual(item, expected[index]));
    }
    if (isObjectRecord(actual) && isObjectRecord(expected)) {
        const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
        // The enum discriminator is derived from `__kind`, so it may be omitted from inputs.
        keys.delete('__discriminator');
        return [...keys].every(key => isValueEqual(actual[key], expected[key]));
    }
    return actual === expected;
}

function isInteger(value: unknown): value is bigint | number {
    return typeof value === 'bigint' || (typeof value === 'number' && Number.isInteger(value));
}

function isEnumVariantValue(value: unknown): value is { __kind: string; data?: unknown } {
    return isObjectRecord(value) && typeof value.__kind === 'string';
}

const BYTES_ENCODERS: Record<BytesEncoding, () => Encoder<string>> = {
    base16: getBase16Encoder,
    base58: getBase58Encoder,
    base64: getBase64Encoder,
    utf8: getUtf8Encoder,
};

/** The content of bytes given as raw bytes or `[encoding, data]` tuples, e.g. `['base16', '0102']`. */
function getBytes(value: unknown): ReadonlyUint8Array | undefined {
    if (value instanceof Uint8Array) return value;
    if (!Array.isArray(value) || value.length !== 2 || typeof value[1] !== 'string') return undefined;
    const encoder = BYTES_ENCODERS[value[0] as BytesEncoding] as (() => Encoder<string>) | undefined;
    return encoder?.().encode(value[1]);
}
