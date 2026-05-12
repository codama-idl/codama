import type { EnumTypeNode, EnumVariantTypeNode, NestedTypeNode, NumberTypeNode } from '@codama/node-types';
import { numberTypeNode } from './NumberTypeNode';

/** A tagged union: a numeric discriminator followed by one of several variant payloads. */
export function enumTypeNode<
    const TVariants extends Array<EnumVariantTypeNode>,
    const TSize extends NestedTypeNode<NumberTypeNode> = NumberTypeNode<'u8'>,
>(
    variants: TVariants,
    options: {
        size?: TSize;
    } = {},
): EnumTypeNode<TVariants, TSize> {
    return Object.freeze({
        kind: 'enumTypeNode',

        // Children.
        variants,
        size: (options.size ?? numberTypeNode('u8')) as TSize,
    });
}
