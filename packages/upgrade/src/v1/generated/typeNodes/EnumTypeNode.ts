import type { EnumVariantTypeNode } from './EnumVariantTypeNode';
import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

/** A tagged union: a numeric discriminator followed by one of several variant payloads. */
export interface EnumTypeNode<
    TVariants extends Array<EnumVariantTypeNode> | undefined = Array<EnumVariantTypeNode> | undefined,
    TSize extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>,
> {
    readonly kind: 'enumTypeNode';

    // Children.
    /** The variants of the enum, in declaration order. */
    readonly variants?: TVariants;
    /**
     * The numeric type used to serialise the discriminator.
     * The discriminator prepends the serialised variant payload to identify which variant was selected. By default it is the index of the variant (starting at 0), unless the variant provides its own custom discriminator value.
     */
    readonly size: TSize;
}
