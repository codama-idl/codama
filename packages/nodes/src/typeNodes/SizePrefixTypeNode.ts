import type { NestedTypeNode, NumberTypeNode, SizePrefixTypeNode, TypeNode } from '@kinobi-so/node-types';

export function sizePrefixTypeNode<
    TType extends TypeNode = TypeNode,
    TPrefix extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>,
>(type: TType, prefix: TPrefix): SizePrefixTypeNode<TType, TPrefix> {
    return Object.freeze({
        kind: 'sizePrefixTypeNode',

        // Children.
        type,
        prefix,
    });
}
