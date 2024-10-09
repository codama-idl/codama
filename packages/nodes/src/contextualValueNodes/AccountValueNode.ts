import type { AccountValueNode } from '@codama/node-types';

import { camelCase } from '../shared';

export function accountValueNode(name: string): AccountValueNode {
    return Object.freeze({
        kind: 'accountValueNode',

        // Data.
        name: camelCase(name),
    });
}
