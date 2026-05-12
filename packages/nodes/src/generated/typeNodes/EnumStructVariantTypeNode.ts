import type { EnumStructVariantTypeNode, NestedTypeNode, StructTypeNode } from '@codama/node-types';
import { camelCase } from '../../shared';

/** A variant of an enum that carries a struct payload (named fields). */
export function enumStructVariantTypeNode<const TStruct extends NestedTypeNode<StructTypeNode>>(
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
