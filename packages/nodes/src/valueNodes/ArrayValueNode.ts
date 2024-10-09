import type { ArrayValueNode, ValueNode } from '@codama/node-types';

export function arrayValueNode<const TItems extends ValueNode[]>(items: TItems): ArrayValueNode<TItems> {
    return Object.freeze({
        kind: 'arrayValueNode',

        // Children.
        items,
    });
}
