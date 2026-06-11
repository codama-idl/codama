import type { AccountValueNode } from '@codama/node-types';
import { camelCase } from '../../shared';

/** Refers to a named account in the surrounding instruction. */
export function accountValueNode(name: string): AccountValueNode {
    return Object.freeze({
        kind: 'accountValueNode',

        // Data.
        name: camelCase(name),
    });
}
