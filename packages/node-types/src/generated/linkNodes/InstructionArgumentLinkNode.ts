import type { CamelCaseString } from '../../brands';
import type { InstructionLinkNode } from './InstructionLinkNode';

/** A reference to an argument of another instruction. */
export interface InstructionArgumentLinkNode<
    TInstruction extends InstructionLinkNode | undefined = InstructionLinkNode | undefined,
> {
    readonly kind: 'instructionArgumentLinkNode';

    // Data.
    /** The name of the referenced instruction argument. */
    readonly name: CamelCaseString;

    // Children.
    /** The instruction the referenced argument belongs to. When omitted, the surrounding instruction is assumed. */
    readonly instruction?: TInstruction;
}
