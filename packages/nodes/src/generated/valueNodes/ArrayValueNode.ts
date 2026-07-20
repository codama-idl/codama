import type { ArrayValueNode, ValueNode } from '@codama/node-types';

/** A concrete array value: a list of value nodes. */
export function arrayValueNode<const TItems extends Array<ValueNode> | undefined>(
    items: TItems,
): ArrayValueNode<TItems> {
    return Object.freeze({
        kind: 'arrayValueNode',

        // Children.
        ...(items !== undefined && items.length > 0 && { items: items as TItems }),
    });
}
