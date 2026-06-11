import type { ConstantValueNode, HiddenSuffixTypeNode, TypeNode } from '@codama/node-types';

/** Suffixes another type with a list of constant values that are written and read but not surfaced as fields to consumers. */
export function hiddenSuffixTypeNode<const TType extends TypeNode, const TSuffix extends Array<ConstantValueNode>>(
    type: TType,
    suffix: TSuffix,
): HiddenSuffixTypeNode<TType, TSuffix> {
    return Object.freeze({
        kind: 'hiddenSuffixTypeNode',

        // Children.
        type,
        suffix,
    });
}
