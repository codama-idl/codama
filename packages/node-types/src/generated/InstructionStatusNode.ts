import type { PluginNode } from './PluginNode';
import type { InstructionLifecycle } from './shared/instructionLifecycle';
import type { TextNode } from './TextNode';

/**
 * The lifecycle stage of an instruction (draft, live, deprecated, archived) with an optional accompanying message.
 * An instruction without a status is considered live — a status node is typically only attached to signal another stage.
 */
export interface InstructionStatusNode<
    TMessage extends string | TextNode | undefined = string | TextNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'instructionStatusNode';

    // Data.
    /** The lifecycle stage. */
    readonly lifecycle: InstructionLifecycle;

    // Children.
    /** Free-form prose accompanying the status — e.g. a deprecation notice with migration guidance. May span multiple lines. */
    readonly message?: TMessage;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
