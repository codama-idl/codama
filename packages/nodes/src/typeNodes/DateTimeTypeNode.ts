import type { DateTimeTypeNode, NestedTypeNode, NumberTypeNode } from '@codama/node-types';

export function dateTimeTypeNode<TNumber extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>>(
    number: TNumber,
): DateTimeTypeNode<TNumber> {
    return Object.freeze({
        kind: 'dateTimeTypeNode',

        // Children.
        number,
    });
}
