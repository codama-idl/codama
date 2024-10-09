import type { ProgramIdValueNode } from '@codama/node-types';

export function programIdValueNode(): ProgramIdValueNode {
    return Object.freeze({ kind: 'programIdValueNode' });
}
