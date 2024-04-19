import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';
import type { TypeNode } from './TypeNode';

export interface SizePrefixTypeNode<
    TType extends TypeNode = TypeNode,
    TPrefix extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>,
> {
    readonly kind: 'sizePrefixTypeNode';

    // Children.
    readonly type: TType;
    readonly prefix: TPrefix;
}
