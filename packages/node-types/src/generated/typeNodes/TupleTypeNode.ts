import type { TypeNode } from './TypeNode';

/** A heterogeneous fixed-length sequence in which each positional slot has its own type. */
export interface TupleTypeNode<TItems extends Array<TypeNode> = Array<TypeNode>> {
    readonly kind: 'tupleTypeNode';

    // Children.
    /** The type of each positional slot, in order. */
    readonly items: TItems;
}
