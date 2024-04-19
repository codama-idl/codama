import type { MapEntryValueNode } from './MapEntryValueNode';

export interface MapValueNode<TEntries extends MapEntryValueNode[] = MapEntryValueNode[]> {
    readonly kind: 'mapValueNode';

    // Children.
    readonly entries: TEntries;
}
