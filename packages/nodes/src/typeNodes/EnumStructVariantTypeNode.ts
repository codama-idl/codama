import type { EnumStructVariantTypeNode, NestedTypeNode, StructTypeNode } from '@codama/node-types';

import { camelCase } from '../shared';

export function enumStructVariantTypeNode<TStruct extends NestedTypeNode<StructTypeNode>>(
    name: string,
    struct: TStruct,
    discriminator?: number,
): EnumStructVariantTypeNode<TStruct> {
    return Object.freeze({
        kind: 'enumStructVariantTypeNode',

        // Data.
        name: camelCase(name),
        ...(discriminator !== undefined && { discriminator }),

        // Children.
        struct,
    });
}
