import type { ImportFrom, PdaLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function pdaLinkNode(name: string, importFrom?: ImportFrom): PdaLinkNode {
    return Object.freeze({
        kind: 'pdaLinkNode',

        // Data.
        name: camelCase(name),
        importFrom,
    });
}
