import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';
import type { TypeNode } from './TypeNode';

/** A value that may be present or absent (Some/None), with an explicit numeric prefix indicating presence. */
export interface OptionTypeNode<
    TItem extends TypeNode = TypeNode,
    TPrefix extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>,
> {
    readonly kind: 'optionTypeNode';

    // Data.
    /** When `true`, the absent variant still occupies the byte size of the present variant (zero-padded). Defaults to `false`. */
    readonly fixed?: boolean;

    // Children.
    /** The type carried by the option when present. */
    readonly item: TItem;
    /** The numeric type used as the presence flag. */
    readonly prefix: TPrefix;
}
