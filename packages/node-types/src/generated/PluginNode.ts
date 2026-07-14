import type { CamelCaseString } from '../brands';

/**
 * Attaches named, plugin-specific data to a node.
 * A plugin is uniquely identified by its `name`; the optional `payload` carries arbitrary, consumer-defined data that only the matching plugin knows how to interpret. Codama itself treats the payload as opaque.
 */
export interface PluginNode {
    readonly kind: 'pluginNode';

    // Data.
    /** The unique name identifying the plugin this data belongs to. */
    readonly name: CamelCaseString;
    /** Arbitrary, plugin-specific data. Its shape is defined by the plugin, not by Codama, and is carried through the graph verbatim. */
    readonly payload?: unknown;
}
