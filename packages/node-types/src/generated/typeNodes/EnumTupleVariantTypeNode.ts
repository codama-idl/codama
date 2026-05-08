import type { CamelCaseString } from '../../brands';
import type { NestedTypeNode } from './NestedTypeNode';
import type { TupleTypeNode } from './TupleTypeNode';

/** A variant of an enum that carries a tuple payload (positional fields). */
export interface EnumTupleVariantTypeNode<
    TTuple extends NestedTypeNode<TupleTypeNode> = NestedTypeNode<TupleTypeNode>,
> {
    readonly kind: 'enumTupleVariantTypeNode';

    // Data.
    /** The name of the variant. */
    readonly name: CamelCaseString;
    /** Explicit discriminator value. When omitted, the discriminator is inferred from the variant position. */
    readonly discriminator?: number;

    // Children.
    /** The tuple of positional fields carried by the variant. */
    readonly tuple: TTuple;
}
