import type { EnumVariantTypeNode } from './EnumVariantTypeNode';
import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

/** A tagged union: a numeric discriminator followed by one of several variant payloads. */
export interface EnumTypeNode<
    TVariants extends Array<EnumVariantTypeNode> = Array<EnumVariantTypeNode>,
    TSize extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>,
> {
    readonly kind: 'enumTypeNode';

    // Children.
    /** The variants of the enum, in declaration order. */
    readonly variants: TVariants;
    /** The numeric type used to serialise the discriminator. */
    readonly size: TSize;
}
