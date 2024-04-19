import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

export interface BooleanTypeNode<TSize extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>> {
    readonly kind: 'booleanTypeNode';

    // Children.
    readonly size: TSize;
}
