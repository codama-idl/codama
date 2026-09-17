import type { IntegerTypeNode, PluginNode, PrefixedCountNode } from '@codama/node-types';

/**
 * A count strategy where the number of items is read from a numeric prefix.
 * This enables nodes such as `arrayTypeNode` to represent collections whose length is stored as a prefix.
 */
export function prefixedCountNode<
    const TPrefix extends IntegerTypeNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    prefix: TPrefix,
    options: {
        plugins?: TPlugins;
    } = {},
): PrefixedCountNode<TPrefix, TPlugins> {
    return Object.freeze({
        kind: 'prefixedCountNode',

        // Children.
        prefix,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
