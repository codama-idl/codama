import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

/**
 * Wraps a number type to provide additional context such as decimal places and a unit.
 * Useful for amounts representing financial values.
 */
export interface AmountTypeNode<TNumber extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>> {
    readonly kind: 'amountTypeNode';

    // Data.
    /**
     * The number of decimal places the wrapped integer carries.
     * For example, an integer value of 12345 with 2 decimal places represents 123.45.
     */
    readonly decimals: number;
    /** The unit of the amount — e.g. "USD" or "%". */
    readonly unit?: string;

    // Children.
    /** The number type the amount wraps. */
    readonly number: TNumber;
}
