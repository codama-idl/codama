import type { AttributeSpec } from '@codama/spec';

import type { AttributeOverride } from './config';

/**
 * The JS identifier used for an attribute when it appears as a
 * positional parameter. Defaults to the spec attribute name; can be
 * overridden via `paramName` when the spec name collides with a TS
 * reserved word (`enum` → `enumLink`).
 */
export function paramIdentifier(attr: AttributeSpec, override: AttributeOverride | undefined): string {
    if (override && 'paramName' in override && override.paramName) return override.paramName;
    return attr.name;
}

/**
 * Map from a spec string-constraint to the `@codama/nodes` runtime helper
 * that validates a plain `string` and brands it. Node factories accept
 * `string` for these attributes and brand the value through the helper,
 * which throws on a malformed value. `version` is excluded — it has no
 * relaxation (callers pass the branded `Version` directly).
 */
const BRANDED_STRING_HELPERS: Readonly<Record<string, string>> = {
    decimal: 'decimalString',
    identifier: 'identifierString',
    integer: 'integerString',
    namespace: 'namespaceString',
    path: 'pathString',
};

/**
 * The name of the brand helper for an attribute whose type is a
 * constrained `string`, or `null` when the attribute is not a branded
 * string (or carries an unrelaxed constraint such as `version`).
 */
export function getBrandedStringHelper(attr: AttributeSpec): string | null {
    if (attr.type.kind !== 'string' || attr.type.constraint === undefined) return null;
    return BRANDED_STRING_HELPERS[attr.type.constraint] ?? null;
}
