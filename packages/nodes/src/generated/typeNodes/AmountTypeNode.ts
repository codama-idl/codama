import type { AmountTypeNode, NestedTypeNode, NumberTypeNode } from '@codama/node-types';

/**
 * Wraps a number type to provide additional context such as decimal places and a unit.
 * Useful for amounts representing financial values.
 */
export function amountTypeNode<const TNumber extends NestedTypeNode<NumberTypeNode>>(
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
