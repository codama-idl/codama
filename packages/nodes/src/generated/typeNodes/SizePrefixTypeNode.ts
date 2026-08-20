import type { NestedTypeNode, NumberTypeNode, SizePrefixTypeNode, TypeNode } from '@codama/node-types';

/**
 * Wraps another type with a numeric prefix indicating the byte length of the wrapped type.
 * When decoding, the size is read first and determines how many bytes the wrapped type may consume.
 */
export function sizePrefixTypeNode<const TType extends TypeNode, const TPrefix extends NestedTypeNode<NumberTypeNode>>(
    type: TType,
    prefix: TPrefix,
): SizePrefixTypeNode<TType, TPrefix> {
    return Object.freeze({
        kind: 'sizePrefixTypeNode',

        // Children.
        type,
        prefix,
    });
}
