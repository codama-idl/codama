import type { DefinedTypeLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function definedTypeLinkNode(name: string): DefinedTypeLinkNode {
    return Object.freeze({
        kind: 'definedTypeLinkNode',

        // Data.
        name: camelCase(name),
    });
}
