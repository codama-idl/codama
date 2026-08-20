import type { NestedTypeNode } from './NestedTypeNode';
import type { NumberTypeNode } from './NumberTypeNode';
import type { TypeNode } from './TypeNode';

/**
 * Wraps another type with a numeric prefix indicating the byte length of the wrapped type.
 * When decoding, the size is read first and determines how many bytes the wrapped type may consume.
 */
export interface SizePrefixTypeNode<
    TType extends TypeNode = TypeNode,
    TPrefix extends NestedTypeNode<NumberTypeNode> = NestedTypeNode<NumberTypeNode>,
> {
    readonly kind: 'sizePrefixTypeNode';

    // Children.
    /** The wrapped type whose serialisation is preceded by its size. */
    readonly type: TType;
    /** The numeric type used as the size prefix. */
    readonly prefix: TPrefix;
}
