import type { PluginNode } from '../PluginNode';

/** A concrete string value. */
export interface StringValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'stringValueNode';

    /** The string value. */
    readonly string: string;
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
