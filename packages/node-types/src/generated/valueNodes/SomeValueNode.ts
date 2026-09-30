import type { PluginNode } from '../PluginNode';
import type { ValueNode } from './ValueNode';

/**
 * The "present" value for an optional type, wrapping a concrete value node.
 * For instance, this can be set as the default value of a field whose type is an `optionTypeNode`.
 */
export interface SomeValueNode<
    TValue extends ValueNode = ValueNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'someValueNode';

    // Children.
    /** The wrapped value. */
    readonly value: TValue;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
