import type { StructFieldTypeNode } from './StructFieldTypeNode';

/** A composite type made of an ordered list of named fields. Fields are encoded and decoded in declaration order. */
export interface StructTypeNode<TFields extends Array<StructFieldTypeNode> = Array<StructFieldTypeNode>> {
    readonly kind: 'structTypeNode';

    // Children.
    /** The fields of the struct, in declaration order. */
    readonly fields: TFields;
}
