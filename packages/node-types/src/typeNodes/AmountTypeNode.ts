import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

export interface AmountTypeNode<TNumber extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>> {
    readonly kind: 'amountTypeNode';

    // Data.
    readonly decimals: number;
    readonly unit?: string;

    // Children.
    readonly number: TNumber;
}
