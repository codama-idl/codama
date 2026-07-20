import type { StructFieldTypeNode, StructTypeNode } from '@codama/node-types';

/** A composite type made of an ordered list of named fields. Fields are encoded and decoded in declaration order. */
export function structTypeNode<const TFields extends Array<StructFieldTypeNode> | undefined>(
    fields: TFields,
): StructTypeNode<TFields> {
    return Object.freeze({
        kind: 'structTypeNode',

        // Children.
        ...(fields !== undefined && fields.length > 0 && { fields: fields as TFields }),
    });
}
