import type { CamelCaseString } from '../../brands';
import type { ProgramLinkNode } from './ProgramLinkNode';

/** A reference to an instruction defined elsewhere — possibly in a different program. */
export interface InstructionLinkNode<TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined> {
    readonly kind: 'instructionLinkNode';

    // Data.
    /** The name of the referenced instruction. */
    readonly name: CamelCaseString;

    // Children.
    /** The program the referenced instruction belongs to. When omitted, the surrounding program is assumed. */
    readonly program?: TProgram;
}
