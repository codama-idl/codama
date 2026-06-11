import type { ValueNode } from './ValueNode';

/** A single (key, value) pair inside a `mapValueNode`. */
export interface MapEntryValueNode<TKey extends ValueNode = ValueNode, TValue extends ValueNode = ValueNode> {
    readonly kind: 'mapEntryValueNode';

    // Children.
    /** The entry key. */
    readonly key: TKey;
    /** The entry value. */
    readonly value: TValue;
}
