import type { SetValueNode, ValueNode } from '@codama/node-types';

/** A concrete set value: a list of unique value nodes. */
export function setValueNode<const TItems extends Array<ValueNode> | undefined>(items: TItems): SetValueNode<TItems> {
    return Object.freeze({
        kind: 'setValueNode',

        // Children.
        ...(items !== undefined && items.length > 0 && { items: items as TItems }),
    });
}
