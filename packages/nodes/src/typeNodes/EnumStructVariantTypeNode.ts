import type { EnumStructVariantTypeNode, NestedTypeNode, StructTypeNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function enumStructVariantTypeNode<TStruct extends NestedTypeNode<StructTypeNode>>(
    name: string,
    struct: TStruct,
    discriminator?: number,
): EnumStructVariantTypeNode<TStruct> {
    if (!name) {
        // TODO: Coded error.
        throw new Error('EnumStructVariantTypeNode must have a name.');
    }

    return Object.freeze({
        kind: 'enumStructVariantTypeNode',

        // Data.
        name: camelCase(name),
        ...(discriminator !== undefined && { discriminator }),

        // Children.
        struct,
    });
}
