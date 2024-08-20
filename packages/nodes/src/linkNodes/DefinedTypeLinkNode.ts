import type { DefinedTypeLinkNode, ProgramLinkNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';
import { programLinkNode } from './ProgramLinkNode';

export function definedTypeLinkNode(name: string, program?: ProgramLinkNode | string): DefinedTypeLinkNode {
    return Object.freeze({
        kind: 'definedTypeLinkNode',

        // Children.
        ...(program === undefined ? {} : { program: typeof program === 'string' ? programLinkNode(program) : program }),

        // Data.
        name: camelCase(name),
    });
}
