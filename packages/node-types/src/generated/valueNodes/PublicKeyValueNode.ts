import type { IdentifierString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/** A concrete 32-byte public key, with an optional symbolic identifier for the address. */
export interface PublicKeyValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'publicKeyValueNode';

    // Data.
    /** The base58-encoded public key. */
    readonly publicKey: string;
    /** A symbolic identifier for the address, useful in generated client code. */
    readonly identifier?: IdentifierString;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
