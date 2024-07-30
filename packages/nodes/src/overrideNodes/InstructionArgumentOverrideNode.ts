import type {
    ImportFrom,
    InstructionArgumentLinkNode,
    InstructionArgumentOverrideNode,
    InstructionInputValueNode,
    InstructionLinkNode} from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function instructionArgumentOverrideNode(
    name: string,
    instruction: InstructionLinkNode,
    replace?: InstructionArgumentLinkNode[],
    defaultValue?: InstructionInputValueNode,
    importFrom?: ImportFrom
): InstructionArgumentOverrideNode {
    return Object.freeze({
        kind: 'instructionArgumentOverrideNode',

        // Data.
        name: camelCase(name),
        instruction,
        ...(defaultValue !== undefined && { defaultValue }),
        ...(importFrom !== undefined && { importFrom }),

        // Children.
        ...(replace !== undefined && { replace }),
    });
}
