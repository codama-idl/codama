import type { IntegerTypeNode, PluginNode, SizePrefixTransformNode } from '@codama/node-types';

/**
 * Precedes the transformed type with a numeric prefix indicating its byte length.
 * When decoding, the size is read first and determines how many bytes the transformed type may consume.
 */
export function sizePrefixTransformNode<
    const TPrefix extends IntegerTypeNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    prefix: TPrefix,
    options: {
        plugins?: TPlugins;
    } = {},
): SizePrefixTransformNode<TPrefix, TPlugins> {
    return Object.freeze({
        kind: 'sizePrefixTransformNode',

        // Children.
        prefix,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
