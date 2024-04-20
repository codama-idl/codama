import type { DefinedTypeLinkNode, ImportFrom } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function definedTypeLinkNode(name: string, importFrom?: ImportFrom): DefinedTypeLinkNode {
    return Object.freeze({
        kind: 'definedTypeLinkNode',

        // Data.
        name: camelCase(name),
        importFrom,
    });
}
