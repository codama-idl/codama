import type { ValueNode } from './ValueNode';

/** The "present" value for an optional type, wrapping a concrete value node. */
export interface SomeValueNode<TValue extends ValueNode = ValueNode> {
    readonly kind: 'someValueNode';

    // Children.
    /** The wrapped value. */
    readonly value: TValue;
}
