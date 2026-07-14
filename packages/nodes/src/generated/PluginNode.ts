import type { PluginNode } from '@codama/node-types';
import { camelCase } from '../shared';

/**
 * Attaches named, plugin-specific data to a node.
 * A plugin is uniquely identified by its `name`; the optional `payload` carries arbitrary, consumer-defined data that only the matching plugin knows how to interpret. Codama itself treats the payload as opaque.
 */
export function pluginNode(name: string, payload?: unknown): PluginNode {
    return Object.freeze({
        kind: 'pluginNode',

        // Data.
        name: camelCase(name),
        ...(payload !== undefined && { payload }),
    });
}
