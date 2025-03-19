import type { CamelCaseString, Docs } from '../shared';
import type { ValueNode } from '../valueNodes';
import type { TypeNode } from './TypeNode';

export interface StructFieldTypeNode<
    TType extends TypeNode = TypeNode,
    TDefaultValue extends ValueNode | undefined = ValueNode | undefined,
> {
    readonly kind: 'structFieldTypeNode';

    // Data.
    readonly name: CamelCaseString;
    readonly defaultValueStrategy?: 'omitted' | 'optional';
    readonly docs?: Docs;

    // Children.
    readonly type: TType;
    readonly defaultValue?: TDefaultValue;
}
