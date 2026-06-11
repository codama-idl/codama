import type { ConstantValueNode, TypeNode, ValueNode } from '@codama/node-types';

/** A typed constant: a type node paired with a concrete value node. */
export function constantValueNode<const TType extends TypeNode, const TValue extends ValueNode>(
    type: TType,
    value: TValue,
): ConstantValueNode<TType, TValue> {
    return Object.freeze({
        kind: 'constantValueNode',

        // Children.
        type,
        value,
    });
}
