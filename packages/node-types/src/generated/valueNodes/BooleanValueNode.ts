import type { PluginNode } from '../PluginNode';

/** A concrete boolean value. */
export interface BooleanValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'booleanValueNode';

    // Data.
    /** The boolean value. */
    readonly boolean: boolean;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
