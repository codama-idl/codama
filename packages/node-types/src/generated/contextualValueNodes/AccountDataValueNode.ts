import type { IdentifierString, PathString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/**
 * Refers to a value within a named account's decoded data.
 * The referenced account must carry an `accountLink` so the account's layout is known.
 * Resolving the value requires reading the account state at presentation time.
 */
export interface AccountDataValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'accountDataValueNode';

    // Data.
    /** The identifier of the referenced account in the surrounding instruction. */
    readonly account: IdentifierString;
    /**
     * The path to the value within the account's decoded data — e.g. `authority` or `state.balances[0]`.
     * Field segments are only valid where the data type resolves to a struct (following links).
     * When absent, the value is the whole decoded account data.
     */
    readonly path?: PathString;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
