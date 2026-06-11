import type { EnumEmptyVariantTypeNode } from '@codama/node-types';
import { camelCase } from '../../shared';

/** A unit-style variant of an enum that carries no payload. */
export function enumEmptyVariantTypeNode(name: string, discriminator?: number): EnumEmptyVariantTypeNode {
    return Object.freeze({
        kind: 'enumEmptyVariantTypeNode',

        // Data.
        name: camelCase(name),
        ...(discriminator !== undefined && { discriminator }),
    });
}
