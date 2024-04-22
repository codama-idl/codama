import type { EnumEmptyVariantTypeNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function enumEmptyVariantTypeNode(name: string, discriminator?: number): EnumEmptyVariantTypeNode {
    return Object.freeze({
        kind: 'enumEmptyVariantTypeNode',

        // Data.
        name: camelCase(name),
        discriminator,
    });
}
