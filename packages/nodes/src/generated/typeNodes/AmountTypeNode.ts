import type { AmountTypeNode, NestedTypeNode, NumberTypeNode } from '@codama/node-types';

/**
 * Wraps a number type to provide additional context such as decimal places and a unit.
 * Particularly useful for representing financial values as integers, since floating-point numbers are notoriously unsafe for that purpose.
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
