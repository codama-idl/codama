import type { TypeNode } from './TypeNode';

export interface RemainderOptionTypeNode<TItem extends TypeNode = TypeNode> {
    readonly kind: 'remainderOptionTypeNode';

    // Children.
    readonly item: TItem;
}
