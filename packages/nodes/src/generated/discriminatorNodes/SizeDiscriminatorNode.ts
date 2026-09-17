import type { PluginNode, SizeDiscriminatorNode } from '@codama/node-types';

/** Identifies a node by its expected total byte size. */
export function sizeDiscriminatorNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    size: number,
    options: {
        plugins?: TPlugins;
    } = {},
): SizeDiscriminatorNode<TPlugins> {
    return Object.freeze({
        kind: 'sizeDiscriminatorNode',

        // Data.
        size,

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
