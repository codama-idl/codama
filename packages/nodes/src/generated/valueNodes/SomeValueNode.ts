import type { SomeValueNode, ValueNode } from '@codama/node-types';

/**
 * The "present" value for an optional type, wrapping a concrete value node.
 * For instance, this can be set as the default value of a field whose type is an `optionTypeNode`.
 */
export function someValueNode<const TValue extends ValueNode>(value: TValue): SomeValueNode<TValue> {
    return Object.freeze({
        kind: 'someValueNode',

        // Children.
        value,
    });
}
