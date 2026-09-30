import type { PluginNode, SetValueNode, ValueNode } from '@codama/node-types';

/** A concrete set value: a list of unique value nodes. */
export function setValueNode<
    const TItems extends Array<ValueNode> | undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    items: TItems,
    options: {
        plugins?: TPlugins;
    } = {},
): SetValueNode<TItems, TPlugins> {
    return Object.freeze({
        kind: 'setValueNode',

        // Children.
        ...(items !== undefined && items.length > 0 && { items: items as TItems }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
