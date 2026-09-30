import type { IdentifierString } from '../brands';
import type { InstructionInputValueNode } from './contextualValueNodes/InstructionInputValueNode';
import type { InstructionAccountDisplayNode } from './displayNodes/InstructionAccountDisplayNode';
import type { AccountLinkNode } from './linkNodes/AccountLinkNode';
import type { PluginNode } from './PluginNode';
import type { TextNode } from './TextNode';

/**
 * An account participating in an instruction, with its identifier, signing/writability flags, and an optional default value.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/4656a08b-2f89-49c2-b428-5378cb1a0b9e)
 */
export interface InstructionAccountNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
    TAccountLink extends AccountLinkNode | undefined = AccountLinkNode | undefined,
    TDisplay extends InstructionAccountDisplayNode | undefined = InstructionAccountDisplayNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'instructionAccountNode';

    // Data.
    /** The identifier of the account. */
    readonly identifier: IdentifierString;
    /** Whether the instruction may write to the account. */
    readonly isWritable: boolean;
    /**
     * Whether the account must sign the transaction.
     * The literal `"either"` indicates a slot that may or may not sign depending on context.
     */
    readonly isSigner: boolean | 'either';
    /**
     * Whether the account slot may be omitted by callers.
     * When `true`, absent accounts are handled according to the `optionalAccountStrategy` attribute of the surrounding `instructionNode`. Defaults to `false`.
     */
    readonly isOptional?: boolean;

    // Children.
    /** Markdown documentation for the account slot. */
    readonly docs?: TDocs;
    /** A default value used to fill the slot when the caller does not provide one. */
    readonly defaultValue?: TDefaultValue;
    /**
     * A reference to the account's data layout. Required for consumers (e.g. `accountDataValueNode`) to read fields from the account.
     * The link's optional `program` allows cross-program references via the root's `additionalPrograms`.
     */
    readonly accountLink?: TAccountLink;
    /** Display metadata describing how the account is presented. */
    readonly display?: TDisplay;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
