import type { InstructionArgumentLinkNode, InstructionLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';
import { instructionLinkNode } from './InstructionLinkNode';

export function instructionArgumentLinkNode(
    name: string,
    instruction?: InstructionLinkNode | string,
): InstructionArgumentLinkNode {
    return Object.freeze({
        kind: 'instructionArgumentLinkNode',

        // Children.
        ...(instruction === undefined
            ? {}
            : { instruction: typeof instruction === 'string' ? instructionLinkNode(instruction) : instruction }),

        // Data.
        name: camelCase(name),
    });
}
