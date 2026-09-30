import type { PluginNode, TransformNode, TupleTypeNode, TypeNode } from '@codama/node-types';

/** A heterogeneous fixed-length sequence in which each positional slot has its own type. */
export function tupleTypeNode<
    const TItems extends Array<TypeNode> | undefined,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    items: TItems,
    options: {
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): TupleTypeNode<TItems, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'tupleTypeNode',

        // Children.
        ...(items !== undefined && items.length > 0 && { items: items as TItems }),
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
