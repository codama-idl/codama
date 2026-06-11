import type { RemainderOptionTypeNode, TypeNode } from '@codama/node-types';

/** A value that may be present or absent. Presence is signalled by whether any bytes remain to be read, with no explicit prefix. */
export function remainderOptionTypeNode<const TItem extends TypeNode>(item: TItem): RemainderOptionTypeNode<TItem> {
    return Object.freeze({
        kind: 'remainderOptionTypeNode',

        // Children.
        item,
    });
}
