import type { ValueNode } from './ValueNode';

export interface SomeValueNode<TValue extends ValueNode = ValueNode> {
    readonly kind: 'someValueNode';

    // Children.
    readonly value: TValue;
}
