import type { CamelCaseString, ImportFrom } from '../shared';
import { InstructionLinkNode } from './InstructionLinkNode';

export interface InstructionAccountLinkNode<
    TInstruction extends InstructionLinkNode = InstructionLinkNode
> {
    readonly kind: 'instructionAccountLinkNode';

    // Data.
    readonly name: CamelCaseString;
    readonly instruction: TInstruction;
    readonly importFrom?: ImportFrom;
}
