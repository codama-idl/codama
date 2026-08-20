import type { CamelCaseString } from '../../brands';
import type { EnumVariantDisplayNode } from '../displayNodes/EnumVariantDisplayNode';

/** A unit-style variant of an enum that carries no payload. */
export interface EnumEmptyVariantTypeNode<
    TDisplay extends EnumVariantDisplayNode | undefined = EnumVariantDisplayNode | undefined,
> {
    readonly kind: 'enumEmptyVariantTypeNode';

    // Data.
    /** The name of the variant. */
    readonly name: CamelCaseString;
    /** Explicit discriminator value. When omitted, the discriminator is the index of the variant in the enum, starting at 0. */
    readonly discriminator?: number;

    // Children.
    /** Display metadata describing how the variant is presented. */
    readonly display?: TDisplay;
}
