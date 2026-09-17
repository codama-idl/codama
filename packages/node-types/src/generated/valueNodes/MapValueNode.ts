import type { PluginNode } from '../PluginNode';
import type { MapEntryValueNode } from './MapEntryValueNode';

/** A concrete map value: a list of (key, value) entries. */
export interface MapValueNode<
    TEntries extends Array<MapEntryValueNode> | undefined = Array<MapEntryValueNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'mapValueNode';

    // Children.
    /** The entries of the map, in order. */
    readonly entries?: TEntries;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
