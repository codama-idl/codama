import type { RemainderCountNode } from '@codama/node-types';

export function remainderCountNode(): RemainderCountNode {
    return Object.freeze({ kind: 'remainderCountNode' });
}
