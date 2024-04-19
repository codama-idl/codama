import type { AccountLinkNode, ImportFrom } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function accountLinkNode(name: string, importFrom?: ImportFrom): AccountLinkNode {
    return Object.freeze({
        kind: 'accountLinkNode',

        // Data.
        name: camelCase(name),
        importFrom,
    });
}
