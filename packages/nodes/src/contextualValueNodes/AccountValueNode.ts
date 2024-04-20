import type { AccountValueNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function accountValueNode(name: string): AccountValueNode {
    return Object.freeze({
        kind: 'accountValueNode',

        // Data.
        name: camelCase(name),
    });
}
