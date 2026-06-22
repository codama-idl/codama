import type {
    EnumStructVariantTypeNode,
    EnumVariantDisplayNode,
    NestedTypeNode,
    StructTypeNode,
} from '@codama/node-types';
import { camelCase } from '../../shared';

/** A variant of an enum that carries a struct payload (named fields). */
export function enumStructVariantTypeNode<
    const TStruct extends NestedTypeNode<StructTypeNode>,
    const TDisplay extends EnumVariantDisplayNode | undefined = undefined,
>(
    name: string,
    struct: TStruct,
    discriminator?: number,
    options: {
        display?: TDisplay;
    } = {},
): EnumStructVariantTypeNode<TStruct, TDisplay> {
    return Object.freeze({
        kind: 'enumStructVariantTypeNode',

        // Data.
        name: camelCase(name),
        ...(discriminator !== undefined && { discriminator }),

        // Children.
        struct,
        ...(options.display !== undefined && { display: options.display }),
    });
}
