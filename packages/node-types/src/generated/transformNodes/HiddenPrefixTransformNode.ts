import type { PluginNode } from '../PluginNode';
import type { ConstantValueNode } from '../valueNodes/ConstantValueNode';

/**
 * Prefixes the transformed type with a list of constant values that are written and read but not surfaced as fields to consumers.
 * When decoding, the prefixed constants are consumed and checked against their expected values before being discarded.
 */
export interface HiddenPrefixTransformNode<
    TPrefix extends Array<ConstantValueNode> | undefined = Array<ConstantValueNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'hiddenPrefixTransformNode';

    // Children.
    /** The constant values written before the transformed type, in order. */
    readonly prefix?: TPrefix;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
