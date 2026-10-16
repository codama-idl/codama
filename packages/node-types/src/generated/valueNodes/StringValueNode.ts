import type { PluginNode } from '../PluginNode';

/** A concrete string value. */
export interface StringValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'stringValueNode';

    // Data.
    /** The string value. */
    readonly string: string;

    // Children.
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
