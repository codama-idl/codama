import type { AmountTypeNode, NestedTypeNode, NumberTypeNode } from '@kinobi-so/node-types';

export function amountTypeNode<TNumber extends NestedTypeNode<NumberTypeNode>>(
    number: TNumber,
    decimals: number,
    unit?: string,
): AmountTypeNode<TNumber> {
    return Object.freeze({
        kind: 'amountTypeNode',

        // Data.
        decimals,
        ...(unit !== undefined && { unit }),

        // Children.
        number,
    });
}
