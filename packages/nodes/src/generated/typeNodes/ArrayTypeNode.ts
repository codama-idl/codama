import type { ArrayTypeNode, CountNode, TypeNode } from '@codama/node-types';

/** A homogeneous list of items. The item type is defined by `item`; the length is determined by the `count` strategy. */
export function arrayTypeNode<const TItem extends TypeNode, const TCount extends CountNode>(
    item: TItem,
    count: TCount,
): ArrayTypeNode<TItem, TCount> {
    return Object.freeze({
        kind: 'arrayTypeNode',

        // Children.
        item,
        count,
    });
}
