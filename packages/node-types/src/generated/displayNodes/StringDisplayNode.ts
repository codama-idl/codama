import type { PluginNode } from '../PluginNode';

/**
 * Display metadata for a string value.
 * The string's wire encoding is carried by `stringTypeNode.encoding`; this node only addresses presentation.
 */
export interface StringDisplayNode<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> {
    readonly kind: 'stringDisplayNode';

    // Data.
    /**
     * The start index of the displayed slice, inclusive. Defaults to the start of the string.
     * Indices apply to the decoded character sequence.
     */
    readonly sliceStart?: number;
    /**
     * The end index of the displayed slice, exclusive. Defaults to the end of the string.
     * Indices apply to the decoded character sequence.
     */
    readonly sliceEnd?: number;

    // Children.
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
