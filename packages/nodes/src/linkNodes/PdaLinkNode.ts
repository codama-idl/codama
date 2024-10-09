import type { PdaLinkNode, ProgramLinkNode } from '@codama/node-types';

import { camelCase } from '../shared';
import { programLinkNode } from './ProgramLinkNode';

export function pdaLinkNode(name: string, program?: ProgramLinkNode | string): PdaLinkNode {
    return Object.freeze({
        kind: 'pdaLinkNode',

        // Children.
        ...(program === undefined ? {} : { program: typeof program === 'string' ? programLinkNode(program) : program }),

        // Data.
        name: camelCase(name),
    });
}
