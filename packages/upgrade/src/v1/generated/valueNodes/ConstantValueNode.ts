import type { TypeNode } from '../typeNodes/TypeNode';
import type { ValueNode } from './ValueNode';

/** A typed constant: a type node paired with a concrete value node. */
export interface ConstantValueNode<TType extends TypeNode = TypeNode, TValue extends ValueNode = ValueNode> {
    readonly kind: 'constantValueNode';

    // Children.
    /** The type of the constant. */
    readonly type: TType;
    /** The concrete value of the constant. */
    readonly value: TValue;
}
