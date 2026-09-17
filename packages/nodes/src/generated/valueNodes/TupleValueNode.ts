import type { PluginNode, TupleValueNode, ValueNode } from '@codama/node-types';

/** A concrete tuple value: a fixed-length sequence of positional value nodes. */
export function tupleValueNode<
    const TItems extends Array<ValueNode> | undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    items: TItems,
    options: {
        plugins?: TPlugins;
    } = {},
): TupleValueNode<TItems, TPlugins> {
    return Object.freeze({
        kind: 'tupleValueNode',

        // Children.
        ...(items !== undefined && items.length > 0 && { items: items as TItems }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
