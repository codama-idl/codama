import type { ProgramIdValueNode } from '@codama/node-types';

/** Refers to the program ID of the surrounding instruction. */
export function programIdValueNode(): ProgramIdValueNode {
    return Object.freeze({
        kind: 'programIdValueNode',
    });
}
