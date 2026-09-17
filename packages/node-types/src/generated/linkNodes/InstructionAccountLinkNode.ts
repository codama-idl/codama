import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';
import type { InstructionLinkNode } from './InstructionLinkNode';

/** A reference to an account of another instruction. */
export interface InstructionAccountLinkNode<
    TInstruction extends InstructionLinkNode | undefined = InstructionLinkNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'instructionAccountLinkNode';

    // Data.
    /** The identifier of the referenced instruction account. */
    readonly identifier: IdentifierString;

    // Children.
    /**
     * The instruction the referenced account belongs to. When omitted, the surrounding instruction is assumed.
     * The instruction link may itself point to a different program if needed.
     */
    readonly instruction?: TInstruction;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
