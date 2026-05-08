import type { CamelCaseString } from '../../brands';
import type { NestedTypeNode } from './NestedTypeNode';
import type { StructTypeNode } from './StructTypeNode';

/** A variant of an enum that carries a struct payload (named fields). */
export interface EnumStructVariantTypeNode<
    TStruct extends NestedTypeNode<StructTypeNode> = NestedTypeNode<StructTypeNode>,
> {
    readonly kind: 'enumStructVariantTypeNode';

    // Data.
    /** The name of the variant. */
    readonly name: CamelCaseString;
    /** Explicit discriminator value. When omitted, the discriminator is inferred from the variant position. */
    readonly discriminator?: number;

    // Children.
    /** The struct of named fields carried by the variant. */
    readonly struct: TStruct;
}
