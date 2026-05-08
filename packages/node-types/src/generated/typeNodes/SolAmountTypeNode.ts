import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

/** A SOL amount expressed in lamports under the wrapped numeric type. */
export interface SolAmountTypeNode<TNumber extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>> {
    readonly kind: 'solAmountTypeNode';

    // Children.
    /** The numeric type used to serialise the lamport amount. */
    readonly number: TNumber;
}
