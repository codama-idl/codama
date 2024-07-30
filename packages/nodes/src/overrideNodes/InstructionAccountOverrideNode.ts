import type {
    AccountNode,
    ImportFrom,
    InstructionAccountLinkNode,
    InstructionAccountOverrideNode,
    InstructionLinkNode} from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function instructionAccountOverrideNode(
    name: string,
    instruction: InstructionLinkNode,
    replace?: InstructionAccountLinkNode[],
    defaultAccount?: AccountNode,
    importFrom?: ImportFrom
): InstructionAccountOverrideNode {
    return Object.freeze({
        kind: 'instructionAccountOverrideNode',

        // Data.
        name: camelCase(name),
        instruction,
        ...(defaultAccount !== undefined && { defaultAccount }),
        ...(importFrom !== undefined && { importFrom }),

        // Children.
        ...(replace !== undefined && { replace }),
    });
}
