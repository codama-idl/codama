import type { PdaLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function pdaLinkNode(name: string): PdaLinkNode {
    return Object.freeze({
        kind: 'pdaLinkNode',

        // Data.
        name: camelCase(name),
    });
}
