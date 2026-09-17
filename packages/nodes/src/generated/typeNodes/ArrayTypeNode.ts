import type { ArrayTypeNode, CountNode, PluginNode, TransformNode, TypeNode } from '@codama/node-types';

/** A homogeneous list of items. The item type is defined by `item`; the length is determined by the `count` strategy. */
export function arrayTypeNode<
    const TItem extends TypeNode,
    const TCount extends CountNode,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    item: TItem,
    count: TCount,
    options: {
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): ArrayTypeNode<TItem, TCount, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'arrayTypeNode',

        // Children.
        item,
        count,
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
