import type { ImportFrom, InstructionLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function instructionLinkNode(name: string, importFrom?: ImportFrom, programName?: string): InstructionLinkNode {
    return Object.freeze({
        kind: 'instructionLinkNode',

        // Data.
        name: camelCase(name),
        importFrom,
        programName: programName ? camelCase(programName) : undefined,
    });
}
