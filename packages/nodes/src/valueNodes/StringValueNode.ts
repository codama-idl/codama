import type { StringValueNode } from '@kinobi-so/node-types';

export function stringValueNode(string: string): StringValueNode {
    return Object.freeze({
        kind: 'stringValueNode',

        // Data.
        string,
    });
}
