import type { SetValueNode, ValueNode } from '@codama/node-types';

/** A concrete set value: a list of unique value nodes. */
export function setValueNode<const TItems extends Array<ValueNode>>(items: TItems): SetValueNode<TItems> {
    return Object.freeze({
        kind: 'setValueNode',

        // Children.
        items,
    });
}
