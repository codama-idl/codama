import type { ValueNode } from './ValueNode';

/** A concrete array value: a list of value nodes. */
export interface ArrayValueNode<TItems extends Array<ValueNode> | undefined = Array<ValueNode> | undefined> {
    readonly kind: 'arrayValueNode';

    // Children.
    /** The items of the array, in order. */
    readonly items?: TItems;
}
