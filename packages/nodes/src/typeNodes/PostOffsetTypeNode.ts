import type { PostOffsetTypeNode, TypeNode } from '@codama/node-types';

export function postOffsetTypeNode<TType extends TypeNode>(
    type: TType,
    offset: number,
    strategy?: PostOffsetTypeNode['strategy'],
): PostOffsetTypeNode<TType> {
    return Object.freeze({
        kind: 'postOffsetTypeNode',

        // Data.
        offset,
        strategy: strategy ?? 'relative',

        // Children.
        type,
    });
}
