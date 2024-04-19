import type { ProgramIdValueNode } from '../contextualValueNodes';
import type { TypeNode } from '../typeNodes';
import type { ValueNode } from '../valueNodes';

export interface ConstantPdaSeedNode<
    TType extends TypeNode = TypeNode,
    TValue extends ProgramIdValueNode | ValueNode = ProgramIdValueNode | ValueNode,
> {
    readonly kind: 'constantPdaSeedNode';

    // Children.
    readonly type: TType;
    readonly value: TValue;
}
