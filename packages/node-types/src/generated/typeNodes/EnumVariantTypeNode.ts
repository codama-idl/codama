import type { IdentifierString } from '../../brands';
import type { EnumVariantDisplayNode } from '../displayNodes/EnumVariantDisplayNode';
import type { PluginNode } from '../PluginNode';
import type { TextNode } from '../TextNode';
import type { TypeNode } from './TypeNode';

/**
 * A named variant of an enum, with an optional data payload.
 * Absent `data` is a unit variant; a struct payload gives named fields, a tuple payload gives positional fields, and any other type node is carried as-is — a variant holding a single type needs no tuple around it.
 */
export interface EnumVariantTypeNode<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TData extends TypeNode | undefined = TypeNode | undefined,
    TDisplay extends EnumVariantDisplayNode | undefined = EnumVariantDisplayNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'enumVariantTypeNode';

    // Data.
    /** The identifier of the variant. */
    readonly identifier: IdentifierString;
    /** Explicit discriminator value. When omitted, the discriminator is the index of the variant in the enum, starting at 0. */
    readonly discriminator?: number;

    // Children.
    /** Markdown documentation for the variant. */
    readonly docs?: TDocs;
    /** The payload carried by the variant. When omitted, the variant is a unit variant. */
    readonly data?: TData;
    /** Display metadata describing how the variant is presented. */
    readonly display?: TDisplay;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
