import type { EnumTupleVariantTypeNode, NestedTypeNode, TupleTypeNode } from '@codama/node-types';
import { camelCase } from '../../shared';

/** A variant of an enum that carries a tuple payload (positional fields). */
export function enumTupleVariantTypeNode<const TTuple extends NestedTypeNode<TupleTypeNode>>(
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
