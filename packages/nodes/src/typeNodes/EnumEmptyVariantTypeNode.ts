import type { EnumEmptyVariantTypeNode } from '@kinobi-so/node-types';

import { camelCase } from '../shared';

export function enumEmptyVariantTypeNode(name: string, discriminator?: number): EnumEmptyVariantTypeNode {
    if (!name) {
        // TODO: Coded error.
        throw new Error('EnumEmptyVariantTypeNode must have a name.');
    }

    return Object.freeze({
        kind: 'enumEmptyVariantTypeNode',

        // Data.
        name: camelCase(name),
        discriminator,
    });
}
