import type { CamelCaseString } from '../../brands';
import type { InstructionLinkNode } from './InstructionLinkNode';

/** A reference to an account of another instruction. */
export interface InstructionAccountLinkNode<
    TInstruction extends InstructionLinkNode | undefined = InstructionLinkNode | undefined,
> {
    readonly kind: 'instructionAccountLinkNode';

    // Data.
    /** The name of the referenced instruction account. */
    readonly name: CamelCaseString;

    // Children.
    /** The instruction the referenced account belongs to. When omitted, the surrounding instruction is assumed. */
    readonly instruction?: TInstruction;
}
