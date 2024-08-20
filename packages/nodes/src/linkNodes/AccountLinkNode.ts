import type { AccountLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function accountLinkNode(name: string): AccountLinkNode {
    return Object.freeze({
        kind: 'accountLinkNode',

        // Data.
        name: camelCase(name),
    });
}
