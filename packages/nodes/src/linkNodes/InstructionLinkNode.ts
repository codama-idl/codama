import type { InstructionLinkNode, ProgramLinkNode } from '@codama/node-types';

import { camelCase } from '../shared';
import { programLinkNode } from './ProgramLinkNode';

export function instructionLinkNode(name: string, program?: ProgramLinkNode | string): InstructionLinkNode {
    return Object.freeze({
        kind: 'instructionLinkNode',

        // Children.
        ...(program === undefined ? {} : { program: typeof program === 'string' ? programLinkNode(program) : program }),

        // Data.
        name: camelCase(name),
    });
}
