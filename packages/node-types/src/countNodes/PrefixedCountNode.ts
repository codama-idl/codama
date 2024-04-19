import type { NestedTypeNode, NumberTypeNode } from '../typeNodes';

export interface PrefixedCountNode<TPrefix extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>> {
    readonly kind: 'prefixedCountNode';

    // Children.
    readonly prefix: TPrefix;
}
