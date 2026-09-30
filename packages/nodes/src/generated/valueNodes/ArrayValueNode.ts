import type { ArrayValueNode, PluginNode, ValueNode } from '@codama/node-types';

/** A concrete array value: a list of value nodes. */
export function arrayValueNode<
    const TItems extends Array<ValueNode> | undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    items: TItems,
    options: {
        plugins?: TPlugins;
    } = {},
): ArrayValueNode<TItems, TPlugins> {
    return Object.freeze({
        kind: 'arrayValueNode',

        // Children.
        ...(items !== undefined && items.length > 0 && { items: items as TItems }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
