import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

/** A boolean serialised as a numeric value. The wrapped number type determines the byte width. */
export interface BooleanTypeNode<TSize extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>> {
    readonly kind: 'booleanTypeNode';

    // Children.
    /** The numeric type used to serialise the boolean. */
    readonly size: TSize;
}
