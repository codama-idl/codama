import type { FixedSizeTransformNode, PluginNode } from '@codama/node-types';

/** Asserts a fixed total byte size for the transformed type. Padding or truncation is applied as needed. */
export function fixedSizeTransformNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    size: number,
    options: {
        plugins?: TPlugins;
    } = {},
): FixedSizeTransformNode<TPlugins> {
    return Object.freeze({
        kind: 'fixedSizeTransformNode',

        // Data.
        size,

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
