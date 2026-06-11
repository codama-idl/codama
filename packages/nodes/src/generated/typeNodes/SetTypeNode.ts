import type { CountNode, SetTypeNode, TypeNode } from '@codama/node-types';

/** A unique-valued collection. The item type is defined by `item`; the size is determined by the `count` strategy. */
export function setTypeNode<const TItem extends TypeNode, const TCount extends CountNode>(
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
