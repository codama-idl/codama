import type { ArgumentValueNode } from '@codama/node-types';

import { camelCase } from '../shared';

export function argumentValueNode(name: string): ArgumentValueNode {
    return Object.freeze({
        kind: 'argumentValueNode',

        // Data.
        name: camelCase(name),
    });
}
