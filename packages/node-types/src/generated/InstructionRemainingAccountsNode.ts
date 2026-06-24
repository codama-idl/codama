import type { Docs } from '../Docs';
import type { InstructionAccountDisplayNode } from './displayNodes/InstructionAccountDisplayNode';
import type { InstructionRemainingAccountsValue } from './InstructionRemainingAccountsValue';

/** A "remaining accounts" slot in an instruction — a variable-length tail of accounts derived from a value. */
export interface InstructionRemainingAccountsNode<
    TValue extends InstructionRemainingAccountsValue = InstructionRemainingAccountsValue,
    TDisplay extends InstructionAccountDisplayNode | undefined = InstructionAccountDisplayNode | undefined,
> {
    readonly kind: 'instructionRemainingAccountsNode';

    // Data.
    /** Whether the remaining-accounts tail may be empty. */
    readonly isOptional?: boolean;
    /**
     * Whether each remaining account must sign the transaction.
     * The literal `"either"` indicates a slot that may or may not sign depending on context.
     */
    readonly isSigner?: boolean | 'either';
    /** Whether the instruction may write to each remaining account. */
    readonly isWritable?: boolean;
    /** Markdown documentation for the remaining-accounts slot. */
    readonly docs?: Docs;

    // Children.
    /** The source of the remaining-accounts list — a referenced argument or a resolver. */
    readonly value: TValue;
    /** Display metadata describing how the remaining-accounts group is presented as a whole. */
    readonly display?: TDisplay;
}
