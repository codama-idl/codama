import type { TupleValueNode, ValueNode } from '@codama/node-types';

/** A concrete tuple value: a fixed-length sequence of positional value nodes. */
export function tupleValueNode<const TItems extends Array<ValueNode>>(items: TItems): TupleValueNode<TItems> {
    return Object.freeze({
        kind: 'tupleValueNode',

        // Children.
        items,
    });
}
