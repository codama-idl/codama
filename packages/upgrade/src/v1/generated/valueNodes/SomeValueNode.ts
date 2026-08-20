import type { ValueNode } from './ValueNode';

/**
 * The "present" value for an optional type, wrapping a concrete value node.
 * For instance, this can be set as the default value of a field whose type is an `optionTypeNode`.
 */
export interface SomeValueNode<TValue extends ValueNode = ValueNode> {
    readonly kind: 'someValueNode';

    // Children.
    /** The wrapped value. */
    readonly value: TValue;
}
