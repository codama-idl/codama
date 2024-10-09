import type { BooleanTypeNode, NestedTypeNode, NumberTypeNode } from '@codama/node-types';

import { numberTypeNode } from './NumberTypeNode';

export function booleanTypeNode<TSize extends NestedTypeNode<NumberTypeNode> = NumberTypeNode<'u8'>>(
    size?: TSize,
): BooleanTypeNode<TSize> {
    return Object.freeze({
        kind: 'booleanTypeNode',

        // Children.
        size: (size ?? numberTypeNode('u8')) as TSize,
    });
}
