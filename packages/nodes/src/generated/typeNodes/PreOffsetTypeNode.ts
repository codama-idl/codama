import type { PreOffsetStrategy, PreOffsetTypeNode, TypeNode } from '@codama/node-types';

/** Before serialising the wrapped type, advance the cursor by `offset` bytes interpreted via the chosen strategy. */
export function preOffsetTypeNode<const TType extends TypeNode>(
    type: TType,
    offset: number,
    strategy: PreOffsetStrategy = 'relative',
): PreOffsetTypeNode<TType> {
    return Object.freeze({
        kind: 'preOffsetTypeNode',

        // Data.
        offset,
        strategy,

        // Children.
        type,
    });
}
