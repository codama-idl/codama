import type { PluginNode } from '../PluginNode';

/** A concrete boolean value. */
export interface BooleanValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'booleanValueNode';

    /** The boolean value. */
    readonly boolean: boolean;
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
