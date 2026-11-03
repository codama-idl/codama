import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/** Refers to a named account in the surrounding instruction. */
export interface AccountValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'accountValueNode';

    /** The identifier of the referenced account. */
    readonly identifier: IdentifierString;
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
