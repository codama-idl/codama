import type { PluginNode, StringValueNode } from '@codama/node-types';

/** A concrete string value. */
export function stringValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    string: string,
    options: {
        plugins?: TPlugins;
    } = {},
): StringValueNode<TPlugins> {
    return Object.freeze({
        kind: 'stringValueNode',

        // Data.
        string,

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
