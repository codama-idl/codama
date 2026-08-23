import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { TypeNode } from './typeNodes/TypeNode';
import type { ValueNode } from './valueNodes/ValueNode';

/** A named constant exposed by the program: a typed value associated with a name. */
export interface ConstantNode<TType extends TypeNode = TypeNode, TValue extends ValueNode = ValueNode> {
    readonly kind: 'constantNode';

    // Data.
    /** The name of the constant. */
    readonly name: CamelCaseString;
    /** Markdown documentation for the constant. */
    readonly docs?: Docs;

    // Children.
    /** The type of the constant. */
    readonly type: TType;
    /** The concrete value of the constant. */
    readonly value: TValue;
}
