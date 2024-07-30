import type { CamelCaseString, ImportFrom } from '../shared';
import { InstructionLinkNode } from './InstructionLinkNode';

export interface InstructionArgumentLinkNode<
    TInstruction extends InstructionLinkNode = InstructionLinkNode
> {
    readonly kind: 'instructionArgumentLinkNode';

    // Data.
    readonly name: CamelCaseString;
    readonly instruction: TInstruction;
    readonly importFrom?: ImportFrom;
}
