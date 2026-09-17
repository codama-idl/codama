import type { BytesTypeNode, PluginNode, TransformNode } from '@codama/node-types';

/** A raw sequence of bytes. Typically carries a fixed-size, size-prefix, or sentinel transform to bound its extent. */
export function bytesTypeNode<
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    options: {
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): BytesTypeNode<TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'bytesTypeNode',

        // Children.
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
