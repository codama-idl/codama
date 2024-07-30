import type { ImportFrom, InstructionAccountLinkNode, InstructionLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function instructionAccountLinkNode(name: string, instruction: InstructionLinkNode, importFrom?: ImportFrom): InstructionAccountLinkNode {
    return Object.freeze({
        kind: 'instructionAccountLinkNode',

        // Data.
        name: camelCase(name),
        instruction,
        importFrom,
    });
}
