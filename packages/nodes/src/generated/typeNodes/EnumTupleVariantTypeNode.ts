import type {
    EnumTupleVariantTypeNode,
    EnumVariantDisplayNode,
    NestedTypeNode,
    TupleTypeNode,
} from '@codama/node-types';
import { camelCase } from '../../shared';

/** A variant of an enum that carries a tuple payload (positional fields). */
export function enumTupleVariantTypeNode<
    const TTuple extends NestedTypeNode<TupleTypeNode>,
    const TDisplay extends EnumVariantDisplayNode | undefined = undefined,
>(
    name: string,
    tuple: TTuple,
    discriminator?: number,
    options: {
        display?: TDisplay;
    } = {},
): EnumTupleVariantTypeNode<TTuple, TDisplay> {
    return Object.freeze({
        kind: 'enumTupleVariantTypeNode',

        // Data.
        name: camelCase(name),
        ...(discriminator !== undefined && { discriminator }),

        // Children.
        tuple,
        ...(options.display !== undefined && { display: options.display }),
    });
}
