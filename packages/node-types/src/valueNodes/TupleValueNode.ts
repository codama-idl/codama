import type { ValueNode } from './ValueNode';

export interface TupleValueNode<TItems extends ValueNode[] = ValueNode[]> {
    readonly kind: 'tupleValueNode';

    // Children.
    readonly items: TItems;
}
