import type { PluginNode } from '../PluginNode';
import type { TextNode } from '../TextNode';

/** Display metadata for an enum variant: its label and whether to hide its inner payload. */
export interface EnumVariantDisplayNode<
    TLabel extends string | TextNode | undefined = string | TextNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'enumVariantDisplayNode';

    // Data.
    /**
     * When `true`, the variant's payload is hidden — only the label is rendered.
     * Useful for tuple payloads that have no per-field handle, or when the payload is purely structural.
     */
    readonly skipInnerData?: boolean;

    // Children.
    /**
     * An override label shown for the variant (e.g. `"Buy"`).
     * When absent, renderers derive a label from the variant `name`.
     */
    readonly label?: TLabel;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
