import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';

/** A timestamp encoded as a number, typically seconds since the Unix epoch. The wrapped number type determines the byte width. */
export interface DateTimeTypeNode<TNumber extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>> {
    readonly kind: 'dateTimeTypeNode';

    // Children.
    /** The numeric type used to serialise the timestamp. */
    readonly number: TNumber;
}
