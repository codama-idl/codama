import type { PluginNode, RemainderOptionTypeNode, TransformNode, TypeNode } from '@codama/node-types';

/** A value that may be present or absent. Presence is signalled by whether any bytes remain to be read, with no explicit prefix. */
export function remainderOptionTypeNode<
    const TItem extends TypeNode,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    item: TItem,
    options: {
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): RemainderOptionTypeNode<TItem, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'remainderOptionTypeNode',

        // Children.
        item,
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
