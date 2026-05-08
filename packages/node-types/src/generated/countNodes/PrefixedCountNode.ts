import type { NestedTypeNode } from '../typeNodes/NestedTypeNode';
import type { NumberTypeNode } from '../typeNodes/NumberTypeNode';

/** A count strategy where the number of items is read from a numeric prefix. */
export interface PrefixedCountNode<TPrefix extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>> {
    readonly kind: 'prefixedCountNode';

    // Children.
    /** The numeric type used as the count prefix. */
    readonly prefix: TPrefix;
}
