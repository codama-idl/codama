import type { PluginNode } from '../PluginNode';

/** Identifies a node by its expected total byte size. */
export interface SizeDiscriminatorNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'sizeDiscriminatorNode';

    /** The expected byte size. */
    readonly size: number;
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
