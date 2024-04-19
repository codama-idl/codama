import type { MainCaseString } from '../shared';

export interface EnumEmptyVariantTypeNode {
    readonly kind: 'enumEmptyVariantTypeNode';

    // Data.
    readonly name: MainCaseString;
    readonly discriminator?: number;
}
