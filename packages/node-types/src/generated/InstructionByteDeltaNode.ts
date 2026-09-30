import type { InstructionByteDeltaValue } from './InstructionByteDeltaValue';
import type { PluginNode } from './PluginNode';

/**
 * A byte-size delta applied when computing rent or buffer size — typically used by instructions that resize accounts.
 * For instance, if an instruction creates a new account of 42 bytes, this node can carry that information, enabling clients to allocate the right amount of lamports to cover the cost of executing the instruction.
 */
export interface InstructionByteDeltaNode<
    TValue extends InstructionByteDeltaValue = InstructionByteDeltaValue,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'instructionByteDeltaNode';

    // Data.
    /** Whether the delta includes the account header overhead — i.e. 128 bytes. */
    readonly withHeader: boolean;
    /** When `true`, the delta is subtracted from the running size instead of added. Defaults to `false`. */
    readonly subtract?: boolean;

    // Children.
    /** The source of the delta value — a literal number, the size of a linked account, or a value within the instruction data. */
    readonly value: TValue;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
