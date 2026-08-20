import type { ProgramIdValueNode } from '@codama/node-types';

/** Refers to the program ID of the surrounding instruction — that is, the address of the `programNode` this node descends from. */
export function programIdValueNode(): ProgramIdValueNode {
    return Object.freeze({
        kind: 'programIdValueNode',
    });
}
