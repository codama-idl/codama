import type { PdaLinkNode, ProgramLinkNode } from '@codama/node-types';
import { camelCase } from '../../shared';
import { programLinkNode } from './ProgramLinkNode';

/** A reference to a PDA defined elsewhere — possibly in a different program. */
export function pdaLinkNode<const TProgram extends ProgramLinkNode | undefined = undefined>(
    name: string,
    program?: TProgram | string,
): PdaLinkNode<TProgram> {
    return Object.freeze({
        kind: 'pdaLinkNode',

        // Data.
        name: camelCase(name),

        // Children.
        ...(program !== undefined && {
            program: (typeof program === 'string' ? programLinkNode(program) : program) as TProgram,
        }),
    });
}
