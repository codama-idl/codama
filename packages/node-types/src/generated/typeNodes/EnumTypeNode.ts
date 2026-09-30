import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { EnumVariantTypeNode } from './EnumVariantTypeNode';
import type { IntegerTypeNode } from './IntegerTypeNode';

/** A tagged union: a numeric discriminator followed by one of several variant payloads. */
export interface EnumTypeNode<
    TVariants extends Array<EnumVariantTypeNode> | undefined = Array<EnumVariantTypeNode> | undefined,
    TSize extends IntegerTypeNode = IntegerTypeNode,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'enumTypeNode';

    // Children.
    /** The variants of the enum, in declaration order. */
    readonly variants?: TVariants;
    /**
     * The integer type used to serialise the discriminator.
     * The discriminator prepends the serialised variant payload to identify which variant was selected. By default it is the index of the variant (starting at 0), unless the variant provides its own custom discriminator value.
     */
    readonly size: TSize;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}
