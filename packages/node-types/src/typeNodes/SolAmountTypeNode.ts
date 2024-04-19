import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

export interface SolAmountTypeNode<TNumber extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>> {
    readonly kind: 'solAmountTypeNode';

    // Children.
    readonly number: TNumber;
}
