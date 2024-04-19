import type { CountNode } from '../countNodes';
import type { TypeNode } from './TypeNode';

export interface SetTypeNode<TItem extends TypeNode = TypeNode, TCount extends CountNode = CountNode> {
    readonly kind: 'setTypeNode';

    // Children.
    readonly item: TItem;
    readonly count: TCount;
}
