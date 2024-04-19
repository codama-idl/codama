import type { NumberValueNode } from '@kinobi-so/node-types';

export function numberValueNode(number: number): NumberValueNode {
    return Object.freeze({
        kind: 'numberValueNode',

        // Data.
        number,
    });
}
