import type { PluginNode } from '../PluginNode';
import type { ValueNode } from './ValueNode';

/**
 * A single (key, value) pair inside a `mapValueNode`.
 * For example, the map `{ total: 42 }` has one entry whose key is the string `"total"` and whose value is the number `42`.
 */
export interface MapEntryValueNode<
    TKey extends ValueNode = ValueNode,
    TValue extends ValueNode = ValueNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'mapEntryValueNode';

    // Children.
    /** The entry key. */
    readonly key: TKey;
    /** The entry value. */
    readonly value: TValue;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
