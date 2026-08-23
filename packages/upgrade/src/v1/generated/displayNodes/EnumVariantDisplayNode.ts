/** Display metadata for an enum variant: its label and whether to hide its inner payload. */
export interface EnumVariantDisplayNode {
    readonly kind: 'enumVariantDisplayNode';

    // Data.
    /**
     * An override label shown for the variant (e.g. `"Buy"`).
     * When absent, renderers derive a label from the variant `name`.
     */
    readonly label?: string;
    /**
     * When `true`, the variant's payload is hidden — only the label is rendered.
     * Useful for tuple payloads that have no per-field handle, or when the payload is purely structural.
     */
    readonly skipInnerData?: boolean;
}
