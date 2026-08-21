/**
 * A count strategy that fixes the number of items at a constant value.
 * This enables nodes such as `arrayTypeNode` to represent collections of a fixed length.
 */
export interface FixedCountNode {
    readonly kind: 'fixedCountNode';

    // Data.
    /** The fixed number of items. */
    readonly value: number;
}
