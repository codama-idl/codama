import type { StringValueNode } from '@codama/node-types';

/** A concrete string value. */
export function stringValueNode(string: string): StringValueNode {
    return Object.freeze({
        kind: 'stringValueNode',

        // Data.
        string,
    });
}
