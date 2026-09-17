import type { PathString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/** Refers to a value within the data of the surrounding instruction. */
export interface DataValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'dataValueNode';

    // Data.
    /**
     * The path to the referenced value, relative to the instruction's data — e.g. `amount` or `config.fees[0]`.
     * Field segments are only valid where the data type resolves to a struct (following links).
     */
    readonly path: PathString;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
