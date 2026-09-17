import type { ConstantValueNode, HiddenSuffixTransformNode, PluginNode } from '@codama/node-types';

/**
 * Suffixes the transformed type with a list of constant values that are written and read but not surfaced as fields to consumers.
 * When decoding, the suffixed constants are consumed and checked against their expected values before being discarded.
 */
export function hiddenSuffixTransformNode<
    const TSuffix extends Array<ConstantValueNode> | undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    suffix: TSuffix,
    options: {
        plugins?: TPlugins;
    } = {},
): HiddenSuffixTransformNode<TSuffix, TPlugins> {
    return Object.freeze({
        kind: 'hiddenSuffixTransformNode',

        // Children.
        ...(suffix !== undefined && suffix.length > 0 && { suffix: suffix as TSuffix }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
