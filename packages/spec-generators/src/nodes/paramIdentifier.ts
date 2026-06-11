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

/** True when the attribute's spec type is `string({ constraint: 'identifier' })`. */
export function isStringIdentifierAttr(attr: AttributeSpec): boolean {
    return attr.type.kind === 'string' && attr.type.constraint === 'identifier';
}
