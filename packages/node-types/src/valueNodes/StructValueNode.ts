import type { StructFieldValueNode } from './StructFieldValueNode';

export interface StructValueNode<TFields extends StructFieldValueNode[] = StructFieldValueNode[]> {
    readonly kind: 'structValueNode';

    // Children.
    readonly fields: TFields;
}
