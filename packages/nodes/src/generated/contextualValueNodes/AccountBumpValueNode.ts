import type { AccountBumpValueNode } from '@codama/node-types';
import { camelCase } from '../../shared';

/** Refers to the bump seed of a named PDA-derived account in the surrounding instruction. */
export function accountBumpValueNode(name: string): AccountBumpValueNode {
    return Object.freeze({
        kind: 'accountBumpValueNode',

        // Data.
        name: camelCase(name),
    });
}
