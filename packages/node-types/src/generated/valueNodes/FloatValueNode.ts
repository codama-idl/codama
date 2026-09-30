import type { DecimalString } from '../../brands';
import type { PluginNode } from '../PluginNode';

/**
 * A concrete floating-point value, stored as a string so round-trips are deterministic across serialisers.
 * The surrounding type context narrows it to a specific width.
 */
export interface FloatValueNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'floatValueNode';

    // Data.
    /**
     * The canonical decimal value — e.g. `"1.5"`, `"-0.25"` or `"602000000"`; never `"1.50"`, `".5"` or `"6.02e8"`. The specials `"NaN"`, `"Infinity"` and `"-Infinity"` are permitted, and `"-0"` is valid since floats have signed zero.
     * The single spelling guarantees that two equal values can never have distinct node representations, so structural comparison, hashing and deduplication never diverge on formatting. It canonicalises the decimal string’s spelling, not the binary float it rounds to — `"0.1"` and a 30-digit decimal that rounds to the same f64 are distinct, individually canonical values.
     */
    readonly value: DecimalString;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
