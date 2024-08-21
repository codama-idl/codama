import type { CamelCaseString } from '../shared';
import type { ProgramLinkNode } from './ProgramLinkNode';

export interface InstructionLinkNode<TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined> {
    readonly kind: 'instructionLinkNode';

    // Children.
    readonly program?: TProgram;

    // Data.
    readonly name: CamelCaseString;
}
