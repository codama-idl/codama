import type { MapEntryValueNode, ValueNode } from '@codama/node-types';

/** A single (key, value) pair inside a `mapValueNode`. */
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
