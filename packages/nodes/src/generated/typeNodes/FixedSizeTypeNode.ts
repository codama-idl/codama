import type { FixedSizeTypeNode, TypeNode } from '@codama/node-types';

/** Wraps another type and asserts a fixed total byte size. Padding or truncation is applied as needed. */
export function fixedSizeTypeNode<const TType extends TypeNode>(type: TType, size: number): FixedSizeTypeNode<TType> {
    return Object.freeze({
        kind: 'fixedSizeTypeNode',

        // Data.
        size,

        // Children.
        type,
    });
}
