import {
    type EnumTypeNode,
    isNode,
    isScalarEnum,
    pascalCase,
    resolveNestedTypeNode,
    titleCase,
    type TypeNode,
} from 'codama';

import { isObjectRecord } from '../shared/util';
import { formatAmountValue, formatDateTimeValue, formatDurationValue, formatStringValue } from './format-value';
import type { DisplayContext } from './types';

/**
 * Formats a single decoded value according to the presentation metadata on its type.
 *
 * Numbers, strings, and enum variants are rendered through their value-display nodes when
 * present; `definedTypeLinkNode`s are followed via the context's link resolver so linked
 * enums resolve to their variants. Any value without applicable display metadata — and any
 * value whose formatter cannot resolve its inputs — falls back to a raw string form.
 */
export async function formatArgumentValue(
    type: TypeNode,
    value: unknown,
    displayContext: DisplayContext,
): Promise<string> {
    const resolvedType = resolveDisplayType(type, displayContext);

    if (isNode(resolvedType, 'numberTypeNode') && resolvedType.display && isNumeric(value)) {
        const formatted = await formatNumber(resolvedType.display, value, displayContext);
        if (formatted !== null) return formatted;
    }

    if (isNode(resolvedType, 'stringTypeNode') && resolvedType.display && typeof value === 'string') {
        return formatStringValue(value, resolvedType.display);
    }

    if (isNode(resolvedType, 'enumTypeNode')) {
        return formatEnumValue(resolvedType, value);
    }

    return rawValue(value);
}

/**
 * Resolves nested type wrappers and follows a single `definedTypeLinkNode` to its underlying type.
 * Shared by the value formatter and the fallback list so links resolve identically in both.
 */
export function resolveDisplayType(type: TypeNode, displayContext: DisplayContext): TypeNode {
    const resolved = resolveNestedTypeNode(type);
    if (isNode(resolved, 'definedTypeLinkNode')) {
        const definedType = displayContext.resolveDefinedType(resolved);
        if (definedType) return resolveNestedTypeNode(definedType.type);
    }
    return resolved;
}

/** Dispatches a number to the matching number-display formatter. */
async function formatNumber(
    display: NonNullable<Extract<TypeNode, { kind: 'numberTypeNode' }>['display']>,
    value: bigint | number,
    displayContext: DisplayContext,
): Promise<string | null> {
    switch (display.kind) {
        case 'amountNumberDisplayNode':
            return await formatAmountValue(value, display, displayContext);
        case 'dateTimeNumberDisplayNode':
            return formatDateTimeValue(value, display);
        case 'durationNumberDisplayNode':
            return formatDurationValue(value, display);
    }
}

/**
 * Formats an enum value using the matched variant's display label.
 * Scalar enums decode to the variant name; data enums decode to `{ __kind: 'PascalVariant', ... }`.
 */
function formatEnumValue(enumType: EnumTypeNode, value: unknown): string {
    const decodedName = enumVariantName(value);
    if (decodedName === null) return rawValue(value);

    // Scalar enums decode to the variant name as-is; data enum `__kind` is the PascalCase form.
    const variant = enumType.variants.find(candidate =>
        isScalarEnum(enumType) ? candidate.name === decodedName : pascalCase(candidate.name) === decodedName,
    );
    if (!variant) return rawValue(value);

    return variant.display?.label ?? titleCase(variant.name);
}

/** Extracts the variant name from a decoded enum value (scalar name string or data enum `__kind`). */
function enumVariantName(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (isObjectRecord(value) && typeof value.__kind === 'string') return value.__kind;
    return null;
}

/** Renders a value without any display metadata as a safe, human-readable string. */
function rawValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'bigint' || typeof value === 'number' || typeof value === 'boolean') {
        return value.toString();
    }
    if (isObjectRecord(value) && typeof value.__kind === 'string') return titleCase(value.__kind);
    return JSON.stringify(value, (_key, v: unknown) => (typeof v === 'bigint' ? v.toString() : v));
}

function isNumeric(value: unknown): value is bigint | number {
    return typeof value === 'bigint' || typeof value === 'number';
}
