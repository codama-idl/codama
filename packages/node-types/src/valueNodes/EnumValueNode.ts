import type { DefinedTypeLinkNode } from '../linkNodes';
import type { MainCaseString } from '../shared';
import type { StructValueNode } from './StructValueNode';
import type { TupleValueNode } from './TupleValueNode';

export interface EnumValueNode<
    TEnum extends DefinedTypeLinkNode = DefinedTypeLinkNode,
    TValue extends StructValueNode | TupleValueNode | undefined = StructValueNode | TupleValueNode | undefined,
> {
    readonly kind: 'enumValueNode';

    // Data.
    readonly variant: MainCaseString;

    // Children.
    readonly enum: TEnum;
    readonly value?: TValue;
}
