import type { IntegerString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/**
 * A concrete integer value, stored as a string so the full 64- and 128-bit ranges survive JSON transport losslessly.
 * In memory it maps to a native big integer (`bigint` in JavaScript, `i128`/`u128` in Rust); the surrounding type context narrows it to a specific width.
 */
export interface IntegerValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'integerValueNode';

    // Data.
    /** The integer value, as a base-10 string — e.g. `"42"` or `"-12048014319693667524"`. */
    readonly value: IntegerString;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
