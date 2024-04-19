import type { TypeNode } from './TypeNode';

export interface TupleTypeNode<TItems extends TypeNode[] = TypeNode[]> {
    readonly kind: 'tupleTypeNode';

    // Children.
    readonly items: TItems;
}
