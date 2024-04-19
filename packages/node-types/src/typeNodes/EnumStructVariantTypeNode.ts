import type { CamelCaseString } from '../shared';
import type { NestedTypeNode } from './NestedTypeNode';
import type { StructTypeNode } from './StructTypeNode';

export interface EnumStructVariantTypeNode<
    TStruct extends NestedTypeNode<StructTypeNode> = NestedTypeNode<StructTypeNode>,
> {
    readonly kind: 'enumStructVariantTypeNode';

    // Data.
    readonly name: CamelCaseString;
    readonly discriminator?: number;

    // Children.
    readonly struct: TStruct;
}
