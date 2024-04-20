import type { RemainderCountNode } from '@kinobi-so/node-types';

export function remainderCountNode(): RemainderCountNode {
    return Object.freeze({ kind: 'remainderCountNode' });
}
