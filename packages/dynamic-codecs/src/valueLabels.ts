import { CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM, isCodamaError } from '@codama/errors';
import { getTextNodeContent } from '@codama/nodes';
import {
    getLastNodeFromPath,
    getLinkablesFromNode,
    getProvidedScopeFromPath,
    LinkableDictionary,
    NodeStack,
    ProvidedScope,
    visit,
} from '@codama/visitors-core';
import type { ReadonlyUint8Array } from '@solana/codecs';

import { getNodeValueCodecVisitor } from './codecs';
import type { DecodedStructFieldTypeNode } from './decoded';
import { getValueNodeVisitor } from './values';

/** Options of {@link getValueLabel}. */
export type GetValueLabelOptions = {
    /** The linkable nodes of the tree, to follow the links of the field's type. Defaults to recording them from the root of its path. */
    readonly linkables?: LinkableDictionary;
    /**
     * The `provides` in scope of the field, to resolve the values injected into its type. Defaults
     * to the instructions on its path, which a field within a linked defined type does not go through.
     */
    readonly scope?: ProvidedScope;
};

/**
 * Get the label a decoded struct field presents instead of its value, e.g. `"All"` for an amount
 * of `u64::MAX`, from the `valueLabels` of its display node. A label matches when its value
 * encodes to the same bytes as the decoded value, using the codec of the field's type, so
 * equal values match whatever their representation, e.g. bytes in different encodings. When
 * several labels match, the first one wins. Returns `undefined` when none matches.
 *
 * Value labels apply to the raw decoded value, before any formatting: use the label, when there
 * is one, instead of the formatted text of the field. The links of its type, e.g. a linked enum,
 * resolve from the linkable nodes of the tree, recorded from the root of the field's path unless
 * given as the `linkables` option.
 *
 * Labels must be values of the field's type, as validators require: a label whose value does not
 * fit, e.g. a string labelling an integer, throws when encoded, as invalid IDLs do in codecs.
 *
 * @example
 * ```ts
 * // u64 field with valueLabels: [valueLabelDisplayNode({ label: 'All', value: integerValueNode('18446744073709551615') })]
 * getValueLabel(amountField); // "All"
 * getValueLabel(amountField) ?? amountField.text; // what to present
 * ```
 */
export function getValueLabel(
    field: DecodedStructFieldTypeNode,
    options: GetValueLabelOptions = {},
): string | undefined {
    const node = getLastNodeFromPath(field.path);
    const valueLabels = node.display?.valueLabels ?? [];
    if (valueLabels.length === 0) return undefined;
    const recordedLinkables = options.linkables ?? getLinkablesFromNode(field.path[0]);

    // As for `getNodeCodec`, the enclosing instructions provide the values injected into the field.
    const stack = new NodeStack(field.path);
    const scope = options.scope ?? getProvidedScopeFromPath(field.path);
    const codec = visit(node.type, getNodeValueCodecVisitor(recordedLinkables, { scope, stack }));
    let bytes: ReadonlyUint8Array;
    try {
        bytes = codec.encode(field.value);
    } catch (error) {
        // Decoded sets may hold duplicates, which never equal a label's value, since sets reject them.
        if (isCodamaError(error, CODAMA_ERROR__DYNAMIC_CLIENT__DUPLICATE_SET_ITEM)) return undefined;
        throw error;
    }

    // Labels hold concrete values, without injections: the codec fills in the defaults they omit.
    const valueVisitor = getValueNodeVisitor(recordedLinkables, { stack });
    const match = valueLabels.find(valueLabel => {
        const labelBytes = codec.encode(visit(valueLabel.value, valueVisitor));
        return labelBytes.length === bytes.length && labelBytes.every((byte, index) => byte === bytes[index]);
    });
    return match ? getTextNodeContent(match.label) : undefined;
}
