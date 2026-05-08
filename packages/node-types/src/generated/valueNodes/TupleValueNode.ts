import type { ValueNode } from './ValueNode';

/** A concrete tuple value: a fixed-length sequence of positional value nodes. */
export interface TupleValueNode<TItems extends Array<ValueNode> = Array<ValueNode>> {
    readonly kind: 'tupleValueNode';

    // Children.
    /** The positional items of the tuple, in order. */
    readonly items: TItems;
}
