import type { CountNode, SetTypeNode, TypeNode } from '@codama/node-types';

export function setTypeNode<TItem extends TypeNode, TCount extends CountNode>(
    item: TItem,
    count: TCount,
): SetTypeNode<TItem, TCount> {
    return Object.freeze({
        kind: 'setTypeNode',

        // Children.
        item,
        count,
    });
}
