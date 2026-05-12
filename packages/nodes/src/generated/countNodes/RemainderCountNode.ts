import type { RemainderCountNode } from '@codama/node-types';

/** A count strategy where items are read until the buffer is exhausted. */
export function remainderCountNode(): RemainderCountNode {
    return Object.freeze({
        kind: 'remainderCountNode',
    });
}
