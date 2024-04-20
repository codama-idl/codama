import type { CamelCaseString } from '../shared';

export interface EnumEmptyVariantTypeNode {
    readonly kind: 'enumEmptyVariantTypeNode';

    // Data.
    readonly name: CamelCaseString;
    readonly discriminator?: number;
}
