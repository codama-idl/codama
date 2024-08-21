import type { CamelCaseString } from '../shared';
import type { InstructionLinkNode } from './InstructionLinkNode';

export interface InstructionAccountLinkNode<
    TInstruction extends InstructionLinkNode | undefined = InstructionLinkNode | undefined,
> {
    readonly kind: 'instructionAccountLinkNode';

    // Children.
    readonly instruction?: TInstruction;

    // Data.
    readonly name: CamelCaseString;
}
