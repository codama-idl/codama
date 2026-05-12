import type { ArrayValueNode, ValueNode } from '@codama/node-types';

/** A concrete array value: a list of value nodes. */
export function arrayValueNode<const TItems extends Array<ValueNode>>(items: TItems): ArrayValueNode<TItems> {
    return Object.freeze({
        kind: 'arrayValueNode',

        // Children.
        items,
    });
}
