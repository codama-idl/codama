import type { ArgumentValueNode } from '@codama/node-types';
import { camelCase } from '../../shared';

/** Refers to a named argument of the surrounding instruction. */
export function argumentValueNode(name: string): ArgumentValueNode {
    return Object.freeze({
        kind: 'argumentValueNode',

        // Data.
        name: camelCase(name),
    });
}
