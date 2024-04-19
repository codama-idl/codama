export interface FixedCountNode {
    readonly kind: 'fixedCountNode';

    // Data.
    readonly value: number;
}
