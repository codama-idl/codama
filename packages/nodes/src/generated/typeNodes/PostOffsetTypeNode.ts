import type { PostOffsetStrategy, PostOffsetTypeNode, TypeNode } from '@codama/node-types';

/** After serialising the wrapped type, advance the cursor by `offset` bytes interpreted via the chosen strategy. */
export function postOffsetTypeNode<const TType extends TypeNode>(
    type: TType,
    offset: number,
    strategy: PostOffsetStrategy = 'relative',
): PostOffsetTypeNode<TType> {
    return Object.freeze({
        kind: 'postOffsetTypeNode',

        // Data.
        offset,
        strategy,

        // Children.
        type,
    });
}
