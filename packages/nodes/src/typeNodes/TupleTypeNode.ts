import type { TupleTypeNode, TypeNode } from '@codama/node-types';

export function tupleTypeNode<const TItems extends TypeNode[] = TypeNode[]>(items: TItems): TupleTypeNode<TItems> {
    return Object.freeze({
        kind: 'tupleTypeNode',

        // Children.
        items,
    });
}
