import type { MainCaseString } from '../shared';
import type { ValueNode } from './ValueNode';

export interface StructFieldValueNode<TValue extends ValueNode = ValueNode> {
    readonly kind: 'structFieldValueNode';

    // Data.
    readonly name: MainCaseString;

    // Children.
    readonly value: TValue;
}
