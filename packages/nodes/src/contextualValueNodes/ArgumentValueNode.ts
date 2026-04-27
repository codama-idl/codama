import type { ArgumentValueNode } from '@codama/node-types';

import { camelCase } from '../shared';

/**
 * `path` segments resolve nested struct fields under the named arg
 * (e.g. `argumentValueNode('plan_data', ['plan_id'])` → `planData.planId`).
 * An empty or omitted path produces a node with no `path` field — empty arrays
 * do not round-trip as `path: []`.
 */
export function argumentValueNode(name: string, path?: readonly string[]): ArgumentValueNode {
    return Object.freeze({
        kind: 'argumentValueNode',

        // Data.
        name: camelCase(name),
        ...(path && path.length > 0 ? { path: Object.freeze(path.map(camelCase)) } : {}),
    });
}
