import type { MainCaseString } from '../shared';
import type { ValueNode } from '../valueNodes';
import type { TypeNode } from './TypeNode';

export interface StructFieldTypeNode<
    TType extends TypeNode = TypeNode,
    TDefaultValue extends ValueNode | undefined = ValueNode | undefined,
> {
    readonly kind: 'structFieldTypeNode';

    // Data.
    readonly name: MainCaseString;
    readonly defaultValueStrategy?: 'omitted' | 'optional';
    readonly docs: string[];

    // Children.
    readonly type: TType;
    readonly defaultValue?: TDefaultValue;
}
