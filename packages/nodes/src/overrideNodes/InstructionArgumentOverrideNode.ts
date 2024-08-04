import type {
    ImportFrom,
    InstructionArgumentLinkNode,
    InstructionArgumentOverrideNode,
    InstructionInputValueNode,
} from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function instructionArgumentOverrideNode(
    name: string,
    replace?: InstructionArgumentLinkNode[],
    defaultValue?: InstructionInputValueNode,
    importFrom?: ImportFrom
): InstructionArgumentOverrideNode {
    return Object.freeze({
        kind: 'instructionArgumentOverrideNode',

        // Data.
        name: camelCase(name),
        ...(defaultValue !== undefined && { defaultValue }),
        ...(importFrom !== undefined && { importFrom }),

        // Children.
        ...(replace !== undefined && { replace }),
    });
}
