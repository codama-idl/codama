import type { NestedTypeNode, NumberTypeNode, SolAmountTypeNode } from '@codama/node-types';

export function solAmountTypeNode<TNumber extends NestedTypeNode<NumberTypeNode>>(
    number: TNumber,
): SolAmountTypeNode<TNumber> {
    return Object.freeze({
        kind: 'solAmountTypeNode',

        // Children.
        number,
    });
}
