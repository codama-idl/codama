import type { PluginNode } from '../PluginNode';

/** Identifies a node by its expected total byte size. */
export interface SizeDiscriminatorNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'sizeDiscriminatorNode';

    // Data.
    /** The expected byte size. */
    readonly size: number;

    // Children.
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
