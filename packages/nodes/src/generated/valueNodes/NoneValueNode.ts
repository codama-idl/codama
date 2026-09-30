import type { NoneValueNode, PluginNode } from '@codama/node-types';

/**
 * The "absent" value for an optional type.
 * For instance, this can be set as the default value of a field whose type is an `optionTypeNode`.
 */
export function noneValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    options: {
        plugins?: TPlugins;
    } = {},
): NoneValueNode<TPlugins> {
    return Object.freeze({
        kind: 'noneValueNode',

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
