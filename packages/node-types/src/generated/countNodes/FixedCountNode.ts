/** A count strategy that fixes the number of items at a constant value. */
export interface FixedCountNode {
    readonly kind: 'fixedCountNode';

    // Data.
    /** The fixed number of items. */
    readonly value: number;
}
