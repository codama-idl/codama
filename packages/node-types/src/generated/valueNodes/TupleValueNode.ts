import type { PluginNode } from '../PluginNode';
import type { ValueNode } from './ValueNode';

/** A concrete tuple value: a fixed-length sequence of positional value nodes. */
export interface TupleValueNode<
    TItems extends Array<ValueNode> | undefined = Array<ValueNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'tupleValueNode';

    // Children.
    /** The positional items of the tuple, in order. */
    readonly items?: TItems;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
