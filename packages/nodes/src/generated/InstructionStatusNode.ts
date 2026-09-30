import type { InstructionLifecycle, InstructionStatusNode, PluginNode, TextNode } from '@codama/node-types';

/**
 * The lifecycle stage of an instruction (draft, live, deprecated, archived) with an optional accompanying message.
 * An instruction without a status is considered live — a status node is typically only attached to signal another stage.
 */
export function instructionStatusNode<
    const TMessage extends string | TextNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    lifecycle: InstructionLifecycle,
    options: {
        message?: TMessage;
        plugins?: TPlugins;
    } = {},
): InstructionStatusNode<TMessage, TPlugins> {
    return Object.freeze({
        kind: 'instructionStatusNode',

        // Data.
        lifecycle,

        // Children.
        ...(options.message !== undefined && { message: options.message }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
