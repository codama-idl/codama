import type { FixedCountNode } from '@codama/node-types';

/** A count strategy that fixes the number of items at a constant value. */
export function fixedCountNode(value: number): FixedCountNode {
    return Object.freeze({
        kind: 'fixedCountNode',

        // Data.
        value,
    });
}
