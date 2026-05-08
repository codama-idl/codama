import type { CountNode } from '../countNodes/CountNode';
import type { TypeNode } from './TypeNode';

/**
 * A keyed map.
 * The key and value types are described by their respective type nodes; the entry count is determined by a count strategy.
 */
export interface MapTypeNode<
    TKey extends TypeNode = TypeNode,
    TValue extends TypeNode = TypeNode,
    TCount extends CountNode = CountNode,
> {
    readonly kind: 'mapTypeNode';

    // Children.
    /** The type of each entry key. */
    readonly key: TKey;
    /** The type of each entry value. */
    readonly value: TValue;
    /** The strategy used to determine the number of entries. */
    readonly count: TCount;
}
