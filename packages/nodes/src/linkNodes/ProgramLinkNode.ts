import type { ProgramLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function programLinkNode(name: string): ProgramLinkNode {
    return Object.freeze({
        kind: 'programLinkNode',

        // Data.
        name: camelCase(name),
    });
}
