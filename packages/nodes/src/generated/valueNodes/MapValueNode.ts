import type { MapEntryValueNode, MapValueNode, PluginNode } from '@codama/node-types';

/** A concrete map value: a list of (key, value) entries. */
export function mapValueNode<
    const TEntries extends Array<MapEntryValueNode> | undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    entries: TEntries,
    options: {
        plugins?: TPlugins;
    } = {},
): MapValueNode<TEntries, TPlugins> {
    return Object.freeze({
        kind: 'mapValueNode',

        // Children.
        ...(entries !== undefined && entries.length > 0 && { entries: entries as TEntries }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
