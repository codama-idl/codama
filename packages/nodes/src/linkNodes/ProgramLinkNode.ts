import type { ProgramLinkNode } from '@codama/node-types';

import { camelCase } from '../shared';

export function programLinkNode(name: string): ProgramLinkNode {
    return Object.freeze({
        kind: 'programLinkNode',

        // Data.
        name: camelCase(name),
    });
}
