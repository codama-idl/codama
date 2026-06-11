import type { CountNode, MapTypeNode, TypeNode } from '@codama/node-types';

/**
 * A keyed map.
 * The key and value types are described by their respective type nodes; the entry count is determined by a count strategy.
 */
export function mapTypeNode<const TKey extends TypeNode, const TValue extends TypeNode, const TCount extends CountNode>(
    key: TKey,
    value: TValue,
    count: TCount,
): MapTypeNode<TKey, TValue, TCount> {
    return Object.freeze({
        kind: 'mapTypeNode',

        // Children.
        key,
        value,
        count,
    });
}
