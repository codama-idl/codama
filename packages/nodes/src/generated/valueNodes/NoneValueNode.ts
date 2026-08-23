import type { NoneValueNode } from '@codama/node-types';

/**
 * The "absent" value for an optional type.
 * For instance, this can be set as the default value of a field whose type is an `optionTypeNode`.
 */
export function noneValueNode(): NoneValueNode {
    return Object.freeze({
        kind: 'noneValueNode',
    });
}
