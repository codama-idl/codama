import type { NestedTypeNode, NumberTypeNode, SolAmountTypeNode } from '@codama/node-types';

/**
 * A SOL amount expressed in lamports under the wrapped numeric type.
 * Equivalent to an `amountTypeNode` with 9 decimals and `SOL` as the unit.
 */
export function solAmountTypeNode<const TNumber extends NestedTypeNode<NumberTypeNode>>(
    number: TNumber,
): SolAmountTypeNode<TNumber> {
    return Object.freeze({
        kind: 'solAmountTypeNode',

        // Children.
        number,
    });
}
