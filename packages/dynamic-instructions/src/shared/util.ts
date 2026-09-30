/**
 * Checks if a value is a plain object record (struct-like).
 */
export function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

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
