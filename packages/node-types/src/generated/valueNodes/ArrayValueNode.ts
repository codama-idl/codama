import type { PluginNode } from '../PluginNode';
import type { ValueNode } from './ValueNode';

/** A concrete array value: a list of value nodes. */
export interface ArrayValueNode<
    TItems extends Array<ValueNode> | undefined = Array<ValueNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'arrayValueNode';

    // Children.
    /** The items of the array, in order. */
    readonly items?: TItems;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
