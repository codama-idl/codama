import type { ProgramIdValueNode } from '@kinobi-so/node-types';

export function programIdValueNode(): ProgramIdValueNode {
    return Object.freeze({ kind: 'programIdValueNode' });
}
