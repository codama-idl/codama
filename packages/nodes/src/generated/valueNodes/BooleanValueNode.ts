import type { BooleanValueNode, PluginNode } from '@codama/node-types';

/** A concrete boolean value. */
export function booleanValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    boolean: boolean,
    options: {
        plugins?: TPlugins;
    } = {},
): BooleanValueNode<TPlugins> {
    return Object.freeze({
        kind: 'booleanValueNode',

        // Data.
        boolean,

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
