import type { PluginNode } from '../PluginNode';
import type { BytesEncoding } from '../shared/bytesEncoding';

/** A concrete bytes value, encoded as text in the chosen encoding. */
export interface BytesValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'bytesValueNode';

    // Data.
    /** The bytes encoded as a text string per the `encoding` attribute. */
    readonly data: string;
    /** The encoding used to represent the bytes as text. */
    readonly encoding: BytesEncoding;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
