import type { PluginNode } from '../PluginNode';

/**
 * The "absent" value for an optional type.
 * For instance, this can be set as the default value of a field whose type is an `optionTypeNode`.
 */
export interface NoneValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'noneValueNode';

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
