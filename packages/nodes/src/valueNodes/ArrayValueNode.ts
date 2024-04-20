import type { ArrayValueNode, ValueNode } from '@kinobi-so/node-types';

export function arrayValueNode<const TItems extends ValueNode[]>(items: TItems): ArrayValueNode<TItems> {
    return Object.freeze({
        kind: 'arrayValueNode',

        // Children.
        items,
    });
}
