import type { NoneValueNode } from '@codama/node-types';

/** The "absent" value for an optional type. */
export function noneValueNode(): NoneValueNode {
    return Object.freeze({
        kind: 'noneValueNode',
    });
}
