import type { AccountLinkNode, ImportFrom, ProgramLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function accountLinkNode(name: string, importFrom?: ImportFrom, program?: ProgramLinkNode): AccountLinkNode {
    return Object.freeze({
        kind: 'accountLinkNode',

        // Data.
        name: camelCase(name),
        importFrom,
        program,
    });
}
