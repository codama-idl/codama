import type { NoneValueNode } from '@kinobi-so/node-types';

export function noneValueNode(): NoneValueNode {
    return Object.freeze({ kind: 'noneValueNode' });
}
