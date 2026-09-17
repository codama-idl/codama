import type { CountNode, MapTypeNode, PluginNode, TransformNode, TypeNode } from '@codama/node-types';

/**
 * A keyed map.
 * The key and value types are described by their respective type nodes; the entry count is determined by a count strategy.
 * Entries are serialised one after the other, each key immediately followed by its value — e.g. key A, value A, key B, value B.
 */
export function mapTypeNode<
    const TKey extends TypeNode,
    const TValue extends TypeNode,
    const TCount extends CountNode,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    key: TKey,
    value: TValue,
    count: TCount,
    options: {
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): MapTypeNode<TKey, TValue, TCount, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'mapTypeNode',

        // Children.
        key,
        value,
        count,
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
