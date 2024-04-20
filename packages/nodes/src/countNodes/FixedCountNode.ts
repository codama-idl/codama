import type { FixedCountNode } from '@kinobi-so/node-types';

export function fixedCountNode(value: number): FixedCountNode {
    return Object.freeze({
        kind: 'fixedCountNode',

        // Data.
        value,
    });
}
