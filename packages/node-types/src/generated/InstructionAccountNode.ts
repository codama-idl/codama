import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { InstructionInputValueNode } from './contextualValueNodes/InstructionInputValueNode';
import type { InstructionAccountDisplayNode } from './displayNodes/InstructionAccountDisplayNode';
import type { AccountLinkNode } from './linkNodes/AccountLinkNode';

/** An account participating in an instruction, with its name, signing/writability flags, and an optional default value. */
export interface InstructionAccountNode<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
    TAccountLink extends AccountLinkNode | undefined = AccountLinkNode | undefined,
    TDisplay extends InstructionAccountDisplayNode | undefined = InstructionAccountDisplayNode | undefined,
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
    /**
     * A reference to the account's data layout. Required for consumers (e.g. `accountFieldValueNode`) to read fields from the account.
     * The link's optional `program` allows cross-program references via the root's `additionalPrograms`.
     */
    readonly accountLink?: TAccountLink;
    /** Display metadata describing how the account is presented. */
    readonly display?: TDisplay;
}
