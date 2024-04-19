import type { EnumVariantTypeNode } from './EnumVariantTypeNode';
import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

export interface EnumTypeNode<
    TVariants extends EnumVariantTypeNode[] = EnumVariantTypeNode[],
    TSize extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>,
> {
    readonly kind: 'enumTypeNode';

    // Children.
    readonly variants: TVariants;
    readonly size: TSize;
}
