import type { CamelCaseString } from '../../brands';
import type { ValueNode } from './ValueNode';

/** A named field of a `structValueNode`. */
export interface StructFieldValueNode<TValue extends ValueNode = ValueNode> {
    readonly kind: 'structFieldValueNode';

    // Data.
    /** The name of the field. */
    readonly name: CamelCaseString;

    // Children.
    /** The concrete value of the field. */
    readonly value: TValue;
}
