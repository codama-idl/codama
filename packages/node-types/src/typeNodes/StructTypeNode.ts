import type { StructFieldTypeNode } from './StructFieldTypeNode';

export interface StructTypeNode<TFields extends StructFieldTypeNode[] = StructFieldTypeNode[]> {
    readonly kind: 'structTypeNode';

    // Children.
    readonly fields: TFields;
}
