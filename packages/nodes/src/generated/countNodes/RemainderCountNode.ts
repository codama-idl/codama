import type { PluginNode, RemainderCountNode } from '@codama/node-types';

/**
 * A count strategy where items are read until the buffer is exhausted.
 * When encoding, items are serialised as-is and the total count is never stored; when decoding, items are read one by one until the end of the buffer.
 * This strategy is therefore only meaningful for the last variable-size region of a buffer.
 */
export function remainderCountNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    options: {
        plugins?: TPlugins;
    } = {},
): RemainderCountNode<TPlugins> {
    return Object.freeze({
        kind: 'remainderCountNode',

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
