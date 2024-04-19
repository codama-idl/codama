import type { CountNode } from '../countNodes';
import type { TypeNode } from './TypeNode';

export interface ArrayTypeNode<TItem extends TypeNode = TypeNode, TCount extends CountNode = CountNode> {
    readonly kind: 'arrayTypeNode';

    // Children.
    readonly item: TItem;
    readonly count: TCount;
}
