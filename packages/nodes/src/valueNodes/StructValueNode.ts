import type { StructFieldValueNode, StructValueNode } from '@codama/node-types';

export function structValueNode<const TFields extends StructFieldValueNode[]>(
    fields: TFields,
): StructValueNode<TFields> {
    return Object.freeze({
        kind: 'structValueNode',

        // Children.
        fields,
    });
}
