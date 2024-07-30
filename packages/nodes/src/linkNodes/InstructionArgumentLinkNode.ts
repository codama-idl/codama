import type { ImportFrom, InstructionArgumentLinkNode, InstructionLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function instructionArgumentLinkNode(name: string, instruction: InstructionLinkNode, importFrom?: ImportFrom): InstructionArgumentLinkNode {
    return Object.freeze({
        kind: 'instructionArgumentLinkNode',

        // Data.
        name: camelCase(name),
        instruction,
        importFrom,
    });
}
