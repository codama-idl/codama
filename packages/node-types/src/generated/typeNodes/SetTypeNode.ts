import type { CountNode } from '../countNodes/CountNode';
import type { TypeNode } from './TypeNode';

/** A unique-valued collection. The item type is defined by `item`; the size is determined by the `count` strategy. */
export interface SetTypeNode<TItem extends TypeNode = TypeNode, TCount extends CountNode = CountNode> {
    readonly kind: 'setTypeNode';

    // Children.
    /** The type of each item in the set. */
    readonly item: TItem;
    /** The strategy used to determine the number of items. */
    readonly count: TCount;
}
