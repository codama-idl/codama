import type { NoneValueNode } from '@codama/node-types';

export function noneValueNode(): NoneValueNode {
    return Object.freeze({ kind: 'noneValueNode' });
}
