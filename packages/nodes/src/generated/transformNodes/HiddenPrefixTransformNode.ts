import type { ConstantValueNode, HiddenPrefixTransformNode, PluginNode } from '@codama/node-types';

/**
 * Prefixes the transformed type with a list of constant values that are written and read but not surfaced as fields to consumers.
 * When decoding, the prefixed constants are consumed and checked against their expected values before being discarded.
 */
export function hiddenPrefixTransformNode<
    const TPrefix extends Array<ConstantValueNode> | undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    prefix: TPrefix,
    options: {
        plugins?: TPlugins;
    } = {},
): HiddenPrefixTransformNode<TPrefix, TPlugins> {
    return Object.freeze({
        kind: 'hiddenPrefixTransformNode',

        // Children.
        ...(prefix !== undefined && prefix.length > 0 && { prefix: prefix as TPrefix }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
