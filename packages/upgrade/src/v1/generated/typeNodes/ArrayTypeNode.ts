import type { CountNode } from '../countNodes/CountNode';
import type { TypeNode } from './TypeNode';

/** A homogeneous list of items. The item type is defined by `item`; the length is determined by the `count` strategy. */
export interface ArrayTypeNode<TItem extends TypeNode = TypeNode, TCount extends CountNode = CountNode> {
    readonly kind: 'arrayTypeNode';

    // Children.
    /** The type of each item in the array. */
    readonly item: TItem;
    /** The strategy used to determine the number of items. */
    readonly count: TCount;
}
