import type { NumberValueNode } from '@codama/node-types';

/**
 * A concrete numeric value.
 * Stored as a 64-bit float; consumers narrow to a specific integer or float width based on the surrounding type context.
 */
export function numberValueNode(number: number): NumberValueNode {
    return Object.freeze({
        kind: 'numberValueNode',

        // Data.
        number,
    });
}
