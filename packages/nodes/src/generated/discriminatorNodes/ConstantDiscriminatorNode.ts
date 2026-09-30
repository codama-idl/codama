import type { ConstantDiscriminatorNode, ConstantValueNode, PluginNode } from '@codama/node-types';

/** Identifies a node by a constant value at a known byte offset (e.g. a magic header). */
export function constantDiscriminatorNode<
    const TConstant extends ConstantValueNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    constant: TConstant,
    options: {
        offset?: number;
        plugins?: TPlugins;
    } = {},
): ConstantDiscriminatorNode<TConstant, TPlugins> {
    return Object.freeze({
        kind: 'constantDiscriminatorNode',

        // Data.
        offset: options.offset ?? 0,

        // Children.
        constant,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
