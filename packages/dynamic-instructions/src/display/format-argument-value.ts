import {
    type DefinedTypeNode,
    type EnumTypeNode,
    getLastNodeFromPath,
    isNode,
    isScalarEnum,
    type NodePath,
    pascalCase,
    resolveNestedTypeNode,
    titleCase,
    type TypeNode,
} from 'codama';

import { isObjectRecord } from '../shared/util';
import { formatAmountValue, formatDateTimeValue, formatDurationValue, formatStringValue } from './format-value';
import type { DisplayContext } from './types';

/** A type resolved through its display links, paired with the path to where it now lives. */
export type ResolvedDisplayType = {
    /** The path locating the resolved type's owner, used to resolve any links nested within it. */
    readonly ownerPath: NodePath;
    /** The resolved type, with wrappers stripped and any top-level link followed. */
    readonly type: TypeNode;
};

/**
 * Formats a single decoded value according to the presentation metadata on its type.
 *
 * Numbers, strings, and enum variants are rendered through their value-display nodes when
 * present; `definedTypeLinkNode`s are followed via the context's link resolver so linked
 * enums resolve to their variants. Any value without applicable display metadata — and any
 * value whose formatter cannot resolve its inputs — falls back to a raw string form.
 *
 * `ownerPath` is the path to the node owning `type` (e.g. an instruction argument), used to
 * resolve any link the type follows against the correct program.
 */
export async function formatArgumentValue(
    type: TypeNode,
    ownerPath: NodePath,
    value: unknown,
    displayContext: Omit<DisplayContext, 'consumedMemberNames'>,
): Promise<string> {
    const resolved = resolveDisplayType(type, ownerPath, displayContext);

    if (isNode(resolved.type, 'numberTypeNode') && resolved.type.display && isNumeric(value)) {
        const formatted = await formatNumber(resolved.type.display, value, displayContext);
        if (formatted !== null) return formatted;
    }

    if (isNode(resolved.type, 'stringTypeNode') && resolved.type.display && typeof value === 'string') {
        return formatStringValue(value, resolved.type.display);
    }

    if (isNode(resolved.type, 'enumTypeNode')) {
        return formatEnumValue(resolved.type, value);
    }

    return rawValue(value);
}

/**
 * Resolves nested type wrappers and follows a single `definedTypeLinkNode` to its underlying type.
 * Shared by the value formatter and the fallback list so links resolve identically in both.
 *
 * The link is resolved by its full path (`ownerPath` plus the link), so the linkable dictionary
 * targets the program the link appears in. When a link is followed, the returned `ownerPath` is
 * rebased onto the resolved defined type so links nested within it — possibly in another program —
 * resolve from the correct location.
 */
export function resolveDisplayType(
    type: TypeNode,
    ownerPath: NodePath,
    displayContext: Omit<DisplayContext, 'consumedMemberNames'>,
): ResolvedDisplayType {
    const resolved = resolveNestedTypeNode(type);
    if (isNode(resolved, 'definedTypeLinkNode')) {
        const definedTypePath = displayContext.resolveDefinedType([...ownerPath, resolved]);
        if (definedTypePath) {
            const definedType = getLastNodeFromPath<DefinedTypeNode>(definedTypePath);
            return { ownerPath: definedTypePath, type: resolveNestedTypeNode(definedType.type) };
        }
    }
    return { ownerPath, type: resolved };
}

/** Dispatches a number to the matching number-display formatter. */
async function formatNumber(
    display: NonNullable<Extract<TypeNode, { kind: 'numberTypeNode' }>['display']>,
    value: bigint | number,
    displayContext: Omit<DisplayContext, 'consumedMemberNames'>,
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
