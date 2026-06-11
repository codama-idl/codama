import type { DateTimeTypeNode, NestedTypeNode, NumberTypeNode } from '@codama/node-types';

/** A timestamp encoded as a number, typically seconds since the Unix epoch. The wrapped number type determines the byte width. */
export function dateTimeTypeNode<const TNumber extends NestedTypeNode<NumberTypeNode>>(
    number: TNumber,
): DateTimeTypeNode<TNumber> {
    return Object.freeze({
        kind: 'dateTimeTypeNode',

        // Children.
        number,
    });
}
