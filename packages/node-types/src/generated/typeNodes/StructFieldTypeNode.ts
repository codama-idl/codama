import type { CamelCaseString } from '../../brands';
import type { Docs } from '../../Docs';
import type { DefaultValueStrategy } from '../shared/defaultValueStrategy';
import type { ValueNode } from '../valueNodes/ValueNode';
import type { TypeNode } from './TypeNode';

/** A named field within a struct type. */
export interface StructFieldTypeNode<
    TType extends TypeNode = TypeNode,
    TDefaultValue extends ValueNode | undefined = ValueNode | undefined,
> {
    readonly kind: 'structFieldTypeNode';

    // Data.
    /** The name of the field. */
    readonly name: CamelCaseString;
    /** How a configured default value is exposed in generated APIs. Required when `defaultValue` is set. */
    readonly defaultValueStrategy?: DefaultValueStrategy;
    /** Markdown documentation for the field. */
    readonly docs?: Docs;

    // Children.
    /** The type of the field. */
    readonly type: TType;
    /** A default value used when the field is omitted by callers. */
    readonly defaultValue?: TDefaultValue;
}
