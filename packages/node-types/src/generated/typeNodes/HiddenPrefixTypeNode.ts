import type { ConstantValueNode } from '../valueNodes/ConstantValueNode';
import type { TypeNode } from './TypeNode';

/** Prefixes another type with a list of constant values that are written and read but not surfaced as fields to consumers. */
export interface HiddenPrefixTypeNode<
    TType extends TypeNode = TypeNode,
    TPrefix extends Array<ConstantValueNode> = Array<ConstantValueNode>,
> {
    readonly kind: 'hiddenPrefixTypeNode';

    // Children.
    /** The wrapped type whose serialisation is preceded by the hidden prefix. */
    readonly type: TType;
    /** The constant values written before the wrapped type, in order. */
    readonly prefix: TPrefix;
}
