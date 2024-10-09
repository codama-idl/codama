import type { NumberValueNode } from '@codama/node-types';

export function numberValueNode(number: number): NumberValueNode {
    return Object.freeze({
        kind: 'numberValueNode',

        // Data.
        number,
    });
}
