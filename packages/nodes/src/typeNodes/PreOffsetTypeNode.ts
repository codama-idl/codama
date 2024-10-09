import type { PreOffsetTypeNode, TypeNode } from '@codama/node-types';

export function preOffsetTypeNode<TType extends TypeNode>(
    type: TType,
    offset: number,
    strategy?: PreOffsetTypeNode['strategy'],
): PreOffsetTypeNode<TType> {
    return Object.freeze({
        kind: 'preOffsetTypeNode',

        // Data.
        offset,
        strategy: strategy ?? 'relative',

        // Children.
        type,
    });
}
