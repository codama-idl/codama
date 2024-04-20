import type { EnumTupleVariantTypeNode, NestedTypeNode, TupleTypeNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function enumTupleVariantTypeNode<TTuple extends NestedTypeNode<TupleTypeNode>>(
    name: string,
    tuple: TTuple,
    discriminator?: number,
): EnumTupleVariantTypeNode<TTuple> {
    if (!name) {
        // TODO: Coded error.
        throw new Error('EnumTupleVariantTypeNode must have a name.');
    }

    return Object.freeze({
        kind: 'enumTupleVariantTypeNode',

        // Data.
        name: camelCase(name),
        ...(discriminator !== undefined && { discriminator }),

        // Children.
        tuple,
    });
}
