import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/** Refers to the bump seed of a named PDA-derived account in the surrounding instruction. */
export interface AccountBumpValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'accountBumpValueNode';

    // Data.
    /** The identifier of the account whose bump seed is referenced. */
    readonly identifier: IdentifierString;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
