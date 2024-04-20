import type { DateTimeTypeNode, NestedTypeNode, NumberTypeNode } from '@kinobi-so/node-types';

export function dateTimeTypeNode<TNumber extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>>(
    number: TNumber,
): DateTimeTypeNode<TNumber> {
    return Object.freeze({
        kind: 'dateTimeTypeNode',

        // Children.
        number,
    });
}
