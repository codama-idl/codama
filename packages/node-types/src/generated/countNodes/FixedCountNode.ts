import type { PluginNode } from '../PluginNode';

/**
 * A count strategy that fixes the number of items at a constant value.
 * This enables nodes such as `arrayTypeNode` to represent collections of a fixed length.
 */
export interface FixedCountNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'fixedCountNode';

    // Data.
    /** The fixed number of items. */
    readonly value: number;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
