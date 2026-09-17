import type { CountNode, PluginNode, SetTypeNode, TransformNode, TypeNode } from '@codama/node-types';

/** A unique-valued collection. The item type is defined by `item`; the size is determined by the `count` strategy. */
export function setTypeNode<
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
): SetTypeNode<TItem, TCount, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'setTypeNode',

        // Children.
        item,
        count,
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
