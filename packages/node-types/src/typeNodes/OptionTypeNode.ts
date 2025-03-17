import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';
import type { TypeNode } from './TypeNode';

export interface OptionTypeNode<
    TItem extends TypeNode = TypeNode,
    TPrefix extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>,
> {
    readonly kind: 'optionTypeNode';

    // Data.
    readonly fixed?: boolean;

    // Children.
    readonly item: TItem;
    readonly prefix: TPrefix;
}
