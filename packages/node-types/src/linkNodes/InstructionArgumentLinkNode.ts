import type { CamelCaseString } from '../shared';
import type { InstructionLinkNode } from './InstructionLinkNode';

export interface InstructionArgumentLinkNode<
    TInstruction extends InstructionLinkNode | undefined = InstructionLinkNode | undefined,
> {
    readonly kind: 'instructionArgumentLinkNode';

    // Children.
    readonly instruction?: TInstruction;

    // Data.
    readonly name: CamelCaseString;
}
