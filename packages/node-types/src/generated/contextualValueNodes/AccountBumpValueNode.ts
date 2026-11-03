import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/** Refers to the bump seed of a named PDA-derived account in the surrounding instruction. */
export interface AccountBumpValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'accountBumpValueNode';

    /** The identifier of the account whose bump seed is referenced. */
    readonly identifier: IdentifierString;
    /** Namespaced plugins with custom structured data. */
    readonly plugins?: TPlugins;
}
