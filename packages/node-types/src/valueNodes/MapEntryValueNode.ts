import type { ValueNode } from './ValueNode';

export interface MapEntryValueNode<TKey extends ValueNode = ValueNode, TValue extends ValueNode = ValueNode> {
    readonly kind: 'mapEntryValueNode';

    // Children.
    readonly key: TKey;
    readonly value: TValue;
}
