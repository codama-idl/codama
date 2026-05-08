import type { StructFieldValueNode } from './StructFieldValueNode';

/** A concrete struct value: a list of named field values. */
export interface StructValueNode<TFields extends Array<StructFieldValueNode> = Array<StructFieldValueNode>> {
    readonly kind: 'structValueNode';

    // Children.
    /** The named fields of the struct value. */
    readonly fields: TFields;
}
