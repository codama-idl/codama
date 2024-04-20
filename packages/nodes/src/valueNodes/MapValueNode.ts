import type { MapEntryValueNode, MapValueNode } from '@kinobi-so/node-types';

export function mapValueNode<const TEntries extends MapEntryValueNode[]>(entries: TEntries): MapValueNode<TEntries> {
    return Object.freeze({
        kind: 'mapValueNode',

        // Children.
        entries,
    });
}
