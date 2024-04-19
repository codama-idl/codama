import type { TypeNode } from '../typeNodes/TypeNode';
import type { ValueNode } from './ValueNode';

export interface ConstantValueNode<TType extends TypeNode = TypeNode, TValue extends ValueNode = ValueNode> {
    readonly kind: 'constantValueNode';

    // Children.
    readonly type: TType;
    readonly value: TValue;
}
