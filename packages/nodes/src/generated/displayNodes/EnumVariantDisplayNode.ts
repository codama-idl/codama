import type { EnumVariantDisplayNode } from '@codama/node-types';

export type EnumVariantDisplayNodeInput = Omit<EnumVariantDisplayNode, 'kind'>;

/** Display metadata for an enum variant: its label and whether to hide its inner payload. */
export function enumVariantDisplayNode(input: EnumVariantDisplayNodeInput): EnumVariantDisplayNode {
    return Object.freeze({
        kind: 'enumVariantDisplayNode',

        // Data.
        ...(input.label !== undefined && { label: input.label }),
        ...(input.skipInnerData !== undefined && { skipInnerData: input.skipInnerData }),
    });
}
