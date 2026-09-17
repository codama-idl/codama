import type { FixedCountNode, PluginNode } from '@codama/node-types';

/**
 * A count strategy that fixes the number of items at a constant value.
 * This enables nodes such as `arrayTypeNode` to represent collections of a fixed length.
 */
export function fixedCountNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    value: number,
    options: {
        plugins?: TPlugins;
    } = {},
): FixedCountNode<TPlugins> {
    return Object.freeze({
        kind: 'fixedCountNode',

        // Data.
        value,

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
