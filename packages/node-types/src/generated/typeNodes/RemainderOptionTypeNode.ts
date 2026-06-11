import type { TypeNode } from './TypeNode';

/** A value that may be present or absent. Presence is signalled by whether any bytes remain to be read, with no explicit prefix. */
export interface RemainderOptionTypeNode<TItem extends TypeNode = TypeNode> {
    readonly kind: 'remainderOptionTypeNode';

    // Children.
    /** The type carried by the option when present. */
    readonly item: TItem;
}
