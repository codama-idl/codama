import { type EnumTypeNode, isNode, type NodePath, pascalCase, titleCase, type TypeNode } from 'codama';

import { isObjectRecord } from '../shared/util';
import { formatAmountValue, formatDateTimeValue, formatDurationValue, formatStringValue } from './format-value';
import { unwrapOptionValue } from './option-value';
import { resolveDisplayType } from './resolve-display-type';
import type { DisplayContext } from './types';

/**
 * A formatted value paired with whether its presentation degraded.
 *
 * `degraded` is `true` only when an `amountNumberDisplayNode` was present but its scale could
 * not be resolved: the raw integer then reads exactly like a scaled amount. Degraded values
 * carry an explicit ` (raw)` marker in their `text` (applied per element inside arrays), and
 * interpolated intents refuse to present them as prose. Other unpresented values — missing
 * display metadata, invalid date-times — are not degraded: their raw forms carry no false
 * confidence.
 */
export type FormattedArgumentValue = {
    degraded: boolean;
    text: string;
};

/**
 * Formats a single decoded value according to the presentation metadata on its type.
 *
 * Numbers, strings, and enum variants are rendered through their value-display nodes when
 * present; `definedTypeLinkNode`s are followed via the context's link resolver so linked
 * enums resolve to their variants; `Option` values are unwrapped so presentation applies to
 * the inner value (`None` renders as `"none"`). Any value without applicable display
 * metadata — and any value whose formatter cannot resolve its inputs — falls back to a raw
 * string form, flagged as `degraded` when the failed presentation was an amount scale (see
 * {@link FormattedArgumentValue}).
 *
 * `ownerPath` is the path to the node owning `type` (e.g. an instruction argument), used to
 * resolve any link the type follows against the correct program.
 */
export async function formatArgumentValue(
    type: TypeNode,
    ownerPath: NodePath,
    value: unknown,
    displayContext: Omit<DisplayContext, 'consumedMemberNames'>,
): Promise<FormattedArgumentValue> {
    const unwrapped = unwrapOptionValue(value);
    if (unwrapped.none) return { degraded: false, text: 'none' };
    const innerValue = unwrapped.value;

    const resolved = resolveDisplayType(type, ownerPath, displayContext);

    // Arrays render compactly through their item type — one comma-joined line whose elements
    // each carry their own presentation (and their own ` (raw)` marker when degraded). The
    // fallback list expands address arrays into per-element fields before reaching here.
    if (isNode(resolved.type, 'arrayTypeNode') && Array.isArray(innerValue)) {
        const itemType = resolved.type.item;
        const elements = await Promise.all(
            innerValue.map(element => formatArgumentValue(itemType, resolved.ownerPath, element, displayContext)),
        );
        return {
            degraded: elements.some(element => element.degraded),
            text: elements.map(element => element.text).join(', '),
        };
    }

    if (isNode(resolved.type, 'numberTypeNode') && resolved.type.display && isNumeric(innerValue)) {
        const formatted = await formatNumber(resolved.type.display, innerValue, displayContext);
        if (formatted !== null) return { degraded: false, text: formatted };
        if (resolved.type.display.kind === 'amountNumberDisplayNode') {
            return { degraded: true, text: `${rawValue(innerValue)} (raw)` };
        }
    }

    if (isNode(resolved.type, 'stringTypeNode') && resolved.type.display && typeof innerValue === 'string') {
        return { degraded: false, text: formatStringValue(innerValue, resolved.type.display) };
    }

    if (isNode(resolved.type, 'enumTypeNode')) {
        return { degraded: false, text: formatEnumValue(resolved.type, innerValue) };
    }

    return { degraded: false, text: rawValue(innerValue) };
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
 *
 * Decoded enum values arrive in several shapes depending on the codec: a numeric discriminator
 * (scalar enums through the dynamic codecs), the variant name as a string, or a
 * `{ __kind: <variant> }` object whose casing varies (raw camelCase or PascalCase). All are
 * matched to the variant; anything unmatched falls back to the raw form.
 */
function formatEnumValue(enumType: EnumTypeNode, value: unknown): string {
    const variants = enumType.variants ?? [];

    // Numeric decode: match the variant's discriminator, explicit or inferred from position.
    if (typeof value === 'number' || typeof value === 'bigint') {
        const target = Number(value);
        const variant = variants.find((candidate, index) => (candidate.discriminator ?? index) === target);
        return variant ? variantLabel(variant) : rawValue(value);
    }

    const decodedName = enumVariantName(value);
    if (decodedName === null) return rawValue(value);

    // Codecs disagree on name casing, so compare through a common PascalCase form.
    const variant = variants.find(candidate => pascalCase(candidate.name) === pascalCase(decodedName));
    return variant ? variantLabel(variant) : rawValue(value);
}

/** The label shown for a variant: its display label, or its title-cased name. */
function variantLabel(variant: NonNullable<EnumTypeNode['variants']>[number]): string {
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
    if (value === null || value === undefined) return '';
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
