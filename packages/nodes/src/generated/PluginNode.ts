import type { PluginNode } from '@codama/node-types';

import { namespaceString } from '../shared';

/**
 * Attaches namespaced, plugin-specific data to a node.
 * A plugin is uniquely identified by its `namespace`; the optional `payload` carries arbitrary, consumer-defined data that only the matching plugin knows how to interpret. Codama itself treats the payload as opaque.
 * Every node can carry plugins via the `plugins` base attribute.
 */
export function pluginNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    namespace: string,
    payload?: unknown,
    options: {
        plugins?: TPlugins;
    } = {},
): PluginNode<TPlugins> {
    return Object.freeze({
        kind: 'pluginNode',

        // Data.
        namespace: namespaceString(namespace),
        ...(payload !== undefined && { payload }),

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
