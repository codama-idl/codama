import type { ConstantValueNode } from '../valueNodes/ConstantValueNode';
import type { TypeNode } from './TypeNode';

/** Suffixes another type with a list of constant values that are written and read but not surfaced as fields to consumers. */
export interface HiddenSuffixTypeNode<
    TType extends TypeNode = TypeNode,
    TSuffix extends Array<ConstantValueNode> = Array<ConstantValueNode>,
> {
    readonly kind: 'hiddenSuffixTypeNode';

    // Children.
    /** The wrapped type whose serialisation is followed by the hidden suffix. */
    readonly type: TType;
    /** The constant values written after the wrapped type, in order. */
    readonly suffix: TSuffix;
}
