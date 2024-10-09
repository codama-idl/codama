import type { FixedSizeTypeNode, TypeNode } from '@codama/node-types';

export function fixedSizeTypeNode<TType extends TypeNode>(type: TType, size: number): FixedSizeTypeNode<TType> {
    return Object.freeze({
        kind: 'fixedSizeTypeNode',

        // Data.
        size,

        // Children.
        type,
    });
}
