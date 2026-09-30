import type { InstructionByteDeltaNode, InstructionByteDeltaValue, PluginNode } from '@codama/node-types';

/**
 * A byte-size delta applied when computing rent or buffer size — typically used by instructions that resize accounts.
 * For instance, if an instruction creates a new account of 42 bytes, this node can carry that information, enabling clients to allocate the right amount of lamports to cover the cost of executing the instruction.
 */
export function instructionByteDeltaNode<
    const TValue extends InstructionByteDeltaValue,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    value: TValue,
    options: {
        withHeader?: boolean;
        subtract?: boolean;
        plugins?: TPlugins;
    } = {},
): InstructionByteDeltaNode<TValue, TPlugins> {
    return Object.freeze({
        kind: 'instructionByteDeltaNode',

        // Data.
        withHeader: options.withHeader ?? true,
        ...(options.subtract !== undefined && { subtract: options.subtract }),

        // Children.
        value,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
