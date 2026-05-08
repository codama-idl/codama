import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { InstructionInputValueNode } from './contextualValueNodes/InstructionInputValueNode';

/** An account participating in an instruction, with its name, signing/writability flags, and an optional default value. */
export interface InstructionAccountNode<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
> {
    readonly kind: 'instructionAccountNode';

    // Data.
    /** The name of the account. */
    readonly name: CamelCaseString;
    /** Whether the instruction may write to the account. */
    readonly isWritable: boolean;
    /**
     * Whether the account must sign the transaction.
     * The literal `"either"` indicates a slot that may or may not sign depending on context.
     */
    readonly isSigner: boolean | 'either';
    /** Whether the account slot may be omitted by callers. */
    readonly isOptional?: boolean;
    /** Markdown documentation for the account slot. */
    readonly docs?: Docs;

    // Children.
    /** A default value used to fill the slot when the caller does not provide one. */
    readonly defaultValue?: TDefaultValue;
}
