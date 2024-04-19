import type { StructFieldTypeNode, StructTypeNode } from '@kinobi-so/node-types';

export function structTypeNode<const TFields extends StructFieldTypeNode[] = StructFieldTypeNode[]>(
    fields: TFields,
): StructTypeNode<TFields> {
    return Object.freeze({
        kind: 'structTypeNode',

        // Children.
        fields,
    });
}
