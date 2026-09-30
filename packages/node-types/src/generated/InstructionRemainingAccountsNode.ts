import type { IdentifierString } from '../brands';
import type { InstructionAccountDisplayNode } from './displayNodes/InstructionAccountDisplayNode';
import type { PluginNode } from './PluginNode';
import type { TextNode } from './TextNode';

/**
 * A "remaining accounts" slot in an instruction — a variable-length tail of accounts appended after the named account slots.
 * Like `instructionAccountNode`, it declares a client input: the identifier names the account-list input exposed to callers. Renderers with matching plugins may fill it automatically.
 */
export interface InstructionRemainingAccountsNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TDisplay extends InstructionAccountDisplayNode | undefined = InstructionAccountDisplayNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'instructionRemainingAccountsNode';

    // Data.
    /** The identifier of the account-list input exposed to callers. */
    readonly identifier: IdentifierString;
    /** Whether the remaining-accounts tail may be empty. Defaults to `false`. */
    readonly isOptional?: boolean;
    /**
     * Whether each remaining account must sign the transaction.
     * The literal `"either"` indicates that each account may or may not be a signer, independently of the others. Defaults to `false`.
     */
    readonly isSigner?: boolean | 'either';
    /** Whether the instruction may write to each remaining account. */
    readonly isWritable?: boolean;

    // Children.
    /** Markdown documentation for the remaining-accounts slot. */
    readonly docs?: TDocs;
    /** Display metadata describing how the remaining-accounts group is presented as a whole. */
    readonly display?: TDisplay;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
