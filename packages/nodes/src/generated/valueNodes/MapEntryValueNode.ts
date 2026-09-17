import type { MapEntryValueNode, PluginNode, ValueNode } from '@codama/node-types';

/**
 * A single (key, value) pair inside a `mapValueNode`.
 * For example, the map `{ total: 42 }` has one entry whose key is the string `"total"` and whose value is the number `42`.
 */
export function mapEntryValueNode<
    const TKey extends ValueNode,
    const TValue extends ValueNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    key: TKey,
    value: TValue,
    options: {
        plugins?: TPlugins;
    } = {},
): MapEntryValueNode<TKey, TValue, TPlugins> {
    return Object.freeze({
        kind: 'mapEntryValueNode',

        // Children.
        key,
        value,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
