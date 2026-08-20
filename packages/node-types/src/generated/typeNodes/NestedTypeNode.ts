import type { FixedSizeTypeNode } from './FixedSizeTypeNode';
import type { HiddenPrefixTypeNode } from './HiddenPrefixTypeNode';
import type { HiddenSuffixTypeNode } from './HiddenSuffixTypeNode';
import type { PostOffsetTypeNode } from './PostOffsetTypeNode';
import type { PreOffsetTypeNode } from './PreOffsetTypeNode';
import type { SentinelTypeNode } from './SentinelTypeNode';
import type { SizePrefixTypeNode } from './SizePrefixTypeNode';
import type { TypeNode } from './TypeNode';

/**
 * A type, possibly wrapped in zero-or-more size, offset, sentinel, or hidden prefix/suffix modifiers.
 * The wrapping is recursive: each modifier wraps another `nestedTypeNode<T>` until the inner `T` is reached.
 * For example, a `nestedTypeNode<stringTypeNode>` can be fulfilled by a plain `stringTypeNode`, by a `fixedSizeTypeNode` wrapping a `stringTypeNode`, or by any deeper nesting such as `hiddenPrefixTypeNode<preOffsetTypeNode<fixedSizeTypeNode<stringTypeNode>>>`.
 */
export type NestedTypeNode<TType extends TypeNode> =
    | FixedSizeTypeNode<NestedTypeNode<TType>>
    | HiddenPrefixTypeNode<NestedTypeNode<TType>>
    | HiddenSuffixTypeNode<NestedTypeNode<TType>>
    | PostOffsetTypeNode<NestedTypeNode<TType>>
    | PreOffsetTypeNode<NestedTypeNode<TType>>
    | SentinelTypeNode<NestedTypeNode<TType>>
    | SizePrefixTypeNode<NestedTypeNode<TType>>
    | TType;
