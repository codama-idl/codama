import type { InstructionLinkNode, ProgramLinkNode } from '@codama/node-types';
import { camelCase } from '../../shared';
import { programLinkNode } from './ProgramLinkNode';

/** A reference to an instruction defined elsewhere — possibly in a different program. */
export function instructionLinkNode<const TProgram extends ProgramLinkNode | undefined = undefined>(
    name: string,
    program?: TProgram | string,
): InstructionLinkNode<TProgram> {
    return Object.freeze({
        kind: 'instructionLinkNode',

        // Data.
        name: camelCase(name),

        // Children.
        ...(program !== undefined && {
            program: (typeof program === 'string' ? programLinkNode(program) : program) as TProgram,
        }),
    });
}
