import type { MapEntryValueNode, ValueNode } from '@codama/node-types';

/**
 * A single (key, value) pair inside a `mapValueNode`.
 * For example, the map `{ total: 42 }` has one entry whose key is the string `"total"` and whose value is the number `42`.
 */
export function mapEntryValueNode<const TKey extends ValueNode, const TValue extends ValueNode>(
    key: TKey,
    value: TValue,
): MapEntryValueNode<TKey, TValue> {
    return Object.freeze({
        kind: 'mapEntryValueNode',

        // Children.
        key,
        value,
    });
}
