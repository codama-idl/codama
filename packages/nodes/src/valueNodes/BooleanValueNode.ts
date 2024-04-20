import { BooleanValueNode } from '@kinobi-so/node-types';

export function booleanValueNode(boolean: boolean): BooleanValueNode {
    return Object.freeze({
        kind: 'booleanValueNode',

        // Data.
        boolean,
    });
}
