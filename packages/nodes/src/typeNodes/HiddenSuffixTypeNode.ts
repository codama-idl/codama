import type { ConstantValueNode, HiddenSuffixTypeNode, TypeNode } from '@codama/node-types';

export function hiddenSuffixTypeNode<TType extends TypeNode, const TSuffix extends ConstantValueNode[]>(
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
