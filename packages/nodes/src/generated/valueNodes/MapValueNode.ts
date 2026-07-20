import type { MapEntryValueNode, MapValueNode } from '@codama/node-types';

/** A concrete map value: a list of (key, value) entries. */
export function mapValueNode<const TEntries extends Array<MapEntryValueNode> | undefined>(
    entries: TEntries,
): MapValueNode<TEntries> {
    return Object.freeze({
        kind: 'mapValueNode',

        // Children.
        ...(entries !== undefined && entries.length > 0 && { entries: entries as TEntries }),
    });
}
