import type { NestedTypeNode, NumberTypeNode, PrefixedCountNode } from '@codama/node-types';

/** A count strategy where the number of items is read from a numeric prefix. */
export function prefixedCountNode<const TPrefix extends NestedTypeNode<NumberTypeNode>>(
    prefix: TPrefix,
): PrefixedCountNode<TPrefix> {
    return Object.freeze({
        kind: 'prefixedCountNode',

        // Children.
        prefix,
    });
}
