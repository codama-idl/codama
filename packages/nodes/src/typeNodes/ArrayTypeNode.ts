import type { ArrayTypeNode, CountNode, TypeNode } from '@codama/node-types';

export function arrayTypeNode<TItem extends TypeNode, TCount extends CountNode>(
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
