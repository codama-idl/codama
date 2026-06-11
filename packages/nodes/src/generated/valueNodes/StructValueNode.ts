import type { StructFieldValueNode, StructValueNode } from '@codama/node-types';

/** A concrete struct value: a list of named field values. */
export function structValueNode<const TFields extends Array<StructFieldValueNode>>(
    fields: TFields,
): StructValueNode<TFields> {
    return Object.freeze({
        kind: 'structValueNode',

        // Children.
        fields,
    });
}
