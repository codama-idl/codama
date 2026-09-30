import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/** Refers to a named account in the surrounding instruction. */
export interface AccountValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'accountValueNode';

    // Data.
    /** The identifier of the referenced account. */
    readonly identifier: IdentifierString;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
