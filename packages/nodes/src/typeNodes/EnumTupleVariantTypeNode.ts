import type { EnumTupleVariantTypeNode, NestedTypeNode, TupleTypeNode } from '@codama/node-types';

import { camelCase } from '../shared';

export function enumTupleVariantTypeNode<TTuple extends NestedTypeNode<TupleTypeNode>>(
    name: string,
    tuple: TTuple,
    discriminator?: number,
): EnumTupleVariantTypeNode<TTuple> {
    return Object.freeze({
        kind: 'enumTupleVariantTypeNode',

        // Data.
        name: camelCase(name),
        ...(discriminator !== undefined && { discriminator }),

        // Children.
        tuple,
    });
}
