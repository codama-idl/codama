import type { PluginNode } from '../PluginNode';
import type { ValueNode } from './ValueNode';

/** A concrete set value: a list of unique value nodes. */
export interface SetValueNode<
    TItems extends Array<ValueNode> | undefined = Array<ValueNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'setValueNode';

    // Children.
    /** The items of the set. */
    readonly items?: TItems;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
