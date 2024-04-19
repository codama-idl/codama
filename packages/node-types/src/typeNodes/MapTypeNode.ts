import type { CountNode } from '../countNodes';
import type { TypeNode } from './TypeNode';

export interface MapTypeNode<
    TKey extends TypeNode = TypeNode,
    TValue extends TypeNode = TypeNode,
    TCount extends CountNode = CountNode,
> {
    readonly kind: 'mapTypeNode';

    // Children.
    readonly key: TKey;
    readonly value: TValue;
    readonly count: TCount;
}
