import type { MapEntryValueNode } from './MapEntryValueNode';

/** A concrete map value: a list of (key, value) entries. */
export interface MapValueNode<TEntries extends Array<MapEntryValueNode> = Array<MapEntryValueNode>> {
    readonly kind: 'mapValueNode';

    // Children.
    /** The entries of the map, in order. */
    readonly entries: TEntries;
}
