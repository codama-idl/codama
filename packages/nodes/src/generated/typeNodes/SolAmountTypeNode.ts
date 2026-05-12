import type { NestedTypeNode, NumberTypeNode, SolAmountTypeNode } from '@codama/node-types';

/** A SOL amount expressed in lamports under the wrapped numeric type. */
export function solAmountTypeNode<const TNumber extends NestedTypeNode<NumberTypeNode>>(
    number: TNumber,
): SolAmountTypeNode<TNumber> {
    return Object.freeze({
        kind: 'solAmountTypeNode',

        // Children.
        number,
    });
}
