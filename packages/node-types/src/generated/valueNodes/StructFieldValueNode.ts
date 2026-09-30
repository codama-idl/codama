import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';
import type { ValueNode } from './ValueNode';

/** A named field of a `structValueNode`. */
export interface StructFieldValueNode<
    TValue extends ValueNode = ValueNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'structFieldValueNode';

    // Data.
    /** The identifier of the field. */
    readonly identifier: IdentifierString;

    // Children.
    /** The concrete value of the field. */
    readonly value: TValue;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
