import type { CamelCaseString, Docs } from './shared';
import type { TypeNode } from './typeNodes/TypeNode';
import type { ValueNode } from './valueNodes/ValueNode';

export interface ConstantNode<TType extends TypeNode = TypeNode, TValue extends ValueNode = ValueNode> {
    readonly kind: 'constantNode';

    // Data.
    readonly name: CamelCaseString;
    readonly docs?: Docs;

    // Children.
    readonly type: TType;
    readonly value: TValue;
}
