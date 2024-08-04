import type {
    AccountNode,
    ImportFrom,
    InstructionAccountLinkNode,
    InstructionAccountOverrideNode,
} from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function instructionAccountOverrideNode(
    name: string,
    replace?: InstructionAccountLinkNode | InstructionAccountLinkNode[],
    defaultAccount?: AccountNode,
    importFrom?: ImportFrom
): InstructionAccountOverrideNode {
    return Object.freeze({
        kind: 'instructionAccountOverrideNode',

        // Data.
        name: camelCase(name),
        ...(defaultAccount !== undefined && { defaultAccount }),
        ...(importFrom !== undefined && { importFrom }),

        // Children.
        ...(replace !== undefined && { replace: Array.isArray(replace) ? replace : [replace] }),
    });
}
