import type { ImportFrom, ProgramLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function programLinkNode(name: string, importFrom?: ImportFrom): ProgramLinkNode {
    return Object.freeze({
        kind: 'programLinkNode',

        // Data.
        name: camelCase(name),
        importFrom,
    });
}
