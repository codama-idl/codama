import type { FixedCountNode } from '@codama/node-types';

export function fixedCountNode(value: number): FixedCountNode {
    return Object.freeze({
        kind: 'fixedCountNode',

        // Data.
        value,
    });
}
