import type { EnumEmptyVariantTypeNode, EnumVariantDisplayNode } from '@codama/node-types';
import { camelCase } from '../../shared';

/** A unit-style variant of an enum that carries no payload. */
export function enumEmptyVariantTypeNode<const TDisplay extends EnumVariantDisplayNode | undefined = undefined>(
    name: string,
    discriminator?: number,
    options: {
        display?: TDisplay;
    } = {},
): EnumEmptyVariantTypeNode<TDisplay> {
    return Object.freeze({
        kind: 'enumEmptyVariantTypeNode',

        // Data.
        name: camelCase(name),
        ...(discriminator !== undefined && { discriminator }),

        // Children.
        ...(options.display !== undefined && { display: options.display }),
    });
}
