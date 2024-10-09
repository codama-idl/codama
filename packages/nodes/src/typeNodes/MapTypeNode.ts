import type { CountNode, MapTypeNode, TypeNode } from '@codama/node-types';

export function mapTypeNode<TKey extends TypeNode, TValue extends TypeNode, TCount extends CountNode>(
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
