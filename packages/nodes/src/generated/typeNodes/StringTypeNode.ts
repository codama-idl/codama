import type { BytesEncoding, PluginNode, StringDisplayNode, StringTypeNode, TransformNode } from '@codama/node-types';

/**
 * A string value.
 * The encoding describes how its bytes are written.
 * The byte length is determined by a transform such as `sizePrefixTransformNode` or `fixedSizeTransformNode`.
 */
export function stringTypeNode<
    const TEncoding extends BytesEncoding = BytesEncoding,
    const TDisplay extends StringDisplayNode | undefined = undefined,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    encoding: TEncoding,
    options: {
        display?: TDisplay;
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): StringTypeNode<TEncoding, TDisplay, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'stringTypeNode',

        // Data.
        encoding,

        // Children.
        ...(options.display !== undefined && { display: options.display }),
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
