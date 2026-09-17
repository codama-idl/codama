import type { PluginNode } from '../PluginNode';

/** Refers to the program ID of the surrounding instruction — that is, the address of the `programNode` this node descends from. */
export interface ProgramIdValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'programIdValueNode';

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
