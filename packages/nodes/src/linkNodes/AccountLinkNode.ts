import type { AccountLinkNode, ProgramLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';
import { programLinkNode } from './ProgramLinkNode';

export function accountLinkNode(name: string, program?: ProgramLinkNode | string): AccountLinkNode {
    return Object.freeze({
        kind: 'accountLinkNode',

        // Children.
        ...(program === undefined ? {} : { program: typeof program === 'string' ? programLinkNode(program) : program }),

        // Data.
        name: camelCase(name),
    });
}
