import type { EnumTypeNode, EnumVariantTypeNode, NestedTypeNode, NumberTypeNode } from '@codama/node-types';

import { numberTypeNode } from './NumberTypeNode';

export function enumTypeNode<
    const TVariants extends EnumVariantTypeNode[],
    TSize extends NestedTypeNode<NumberTypeNode> = NumberTypeNode<'u8'>,
>(variants: TVariants, options: { size?: TSize } = {}): EnumTypeNode<TVariants, TSize> {
    return Object.freeze({
        kind: 'enumTypeNode',

        // Children.
        variants,
        size: (options.size ?? numberTypeNode('u8')) as TSize,
    });
}

export function isScalarEnum(node: EnumTypeNode): boolean {
    return node.variants.every(variant => variant.kind === 'enumEmptyVariantTypeNode');
}

export function isDataEnum(node: EnumTypeNode): boolean {
    return !isScalarEnum(node);
}
