import type { ImportFrom, PdaLinkNode, ProgramLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function pdaLinkNode(name: string, importFrom?: ImportFrom, program?: ProgramLinkNode): PdaLinkNode {
    return Object.freeze({
        kind: 'pdaLinkNode',

        // Data.
        name: camelCase(name),
        importFrom,
        program,
    });
}
