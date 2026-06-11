import type { CamelCaseString } from '../../brands';

/** A unit-style variant of an enum that carries no payload. */
export interface EnumEmptyVariantTypeNode {
    readonly kind: 'enumEmptyVariantTypeNode';

    // Data.
    /** The name of the variant. */
    readonly name: CamelCaseString;
    /** Explicit discriminator value. When omitted, the discriminator is inferred from the variant position. */
    readonly discriminator?: number;
}
