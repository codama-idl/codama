import type { AccountBumpValueNode } from '@codama/node-types';

import { camelCase } from '../shared';

export function accountBumpValueNode(name: string): AccountBumpValueNode {
    return Object.freeze({
        kind: 'accountBumpValueNode',

        // Data.
        name: camelCase(name),
    });
}
