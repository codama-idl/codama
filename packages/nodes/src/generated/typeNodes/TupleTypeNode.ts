import type { TupleTypeNode, TypeNode } from '@codama/node-types';

/** A heterogeneous fixed-length sequence in which each positional slot has its own type. */
export function tupleTypeNode<const TItems extends Array<TypeNode>>(items: TItems): TupleTypeNode<TItems> {
    return Object.freeze({
        kind: 'tupleTypeNode',

        // Children.
        items,
    });
}
