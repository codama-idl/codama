import type { CamelCaseString, ImportFrom } from '../shared';
import { ProgramLinkNode } from './ProgramLinkNode';

export interface InstructionLinkNode<TProgram extends ProgramLinkNode | undefined = ProgramLinkNode | undefined> {
    readonly kind: 'instructionLinkNode';

    // Data.
    readonly name: CamelCaseString;
    readonly importFrom?: ImportFrom;
    readonly program?: TProgram;
}
