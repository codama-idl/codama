import type { PluginNode } from '../PluginNode';
import type { StructFieldValueNode } from './StructFieldValueNode';

/** A concrete struct value: a list of named field values. */
export interface StructValueNode<
    TFields extends Array<StructFieldValueNode> | undefined = Array<StructFieldValueNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'structValueNode';

    // Children.
    /** The named fields of the struct value. */
    readonly fields?: TFields;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
