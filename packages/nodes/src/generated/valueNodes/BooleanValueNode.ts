import type { BooleanValueNode } from '@codama/node-types';

/** A concrete boolean value. */
export function booleanValueNode(boolean: boolean): BooleanValueNode {
    return Object.freeze({
        kind: 'booleanValueNode',

        // Data.
        boolean,
    });
}
