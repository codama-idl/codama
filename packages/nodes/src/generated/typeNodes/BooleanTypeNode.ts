import type { BooleanTypeNode, NestedTypeNode, NumberTypeNode } from '@codama/node-types';
import { numberTypeNode } from './NumberTypeNode';

/** A boolean serialised as a numeric value. The wrapped number type determines the byte width. */
export function booleanTypeNode<const TSize extends NestedTypeNode<NumberTypeNode> = NumberTypeNode<'u8'>>(
    size: TSize = numberTypeNode('u8') as NumberTypeNode<'u8'> as TSize,
): BooleanTypeNode<TSize> {
    return Object.freeze({
        kind: 'booleanTypeNode',

        // Children.
        size,
    });
}
