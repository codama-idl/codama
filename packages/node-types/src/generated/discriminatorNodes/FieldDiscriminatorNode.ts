import type { PathString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/** Identifies a node by the value of a field at a known byte offset. */
export interface FieldDiscriminatorNode<
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'fieldDiscriminatorNode';

    // Data.
    /**
     * The path to the discriminating field, relative to the account or instruction data — e.g. `discriminator` or `header.kind`.
     * Field segments are only valid where the data type resolves to a struct (following links).
     */
    readonly path: PathString;
    /** The byte offset of the field. */
    readonly offset: number;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
