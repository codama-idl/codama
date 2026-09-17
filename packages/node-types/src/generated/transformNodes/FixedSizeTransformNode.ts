import type { PluginNode } from '../PluginNode';

/** Asserts a fixed total byte size for the transformed type. Padding or truncation is applied as needed. */
export interface FixedSizeTransformNode<
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'fixedSizeTransformNode';

    // Data.
    /** The total byte size the transformed type must occupy. */
    readonly size: number;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
