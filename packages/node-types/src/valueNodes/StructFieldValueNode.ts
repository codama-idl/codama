import type { CamelCaseString } from '../shared';
import type { ValueNode } from './ValueNode';

export interface StructFieldValueNode<TValue extends ValueNode = ValueNode> {
    readonly kind: 'structFieldValueNode';

    // Data.
    readonly name: CamelCaseString;

    // Children.
    readonly value: TValue;
}
