import type { FixedSizeTypeNode } from './FixedSizeTypeNode';
import type { HiddenPrefixTypeNode } from './HiddenPrefixTypeNode';
import type { HiddenSuffixTypeNode } from './HiddenSuffixTypeNode';
import type { PostOffsetTypeNode } from './PostOffsetTypeNode';
import type { PreOffsetTypeNode } from './PreOffsetTypeNode';
import type { SentinelTypeNode } from './SentinelTypeNode';
import type { SizePrefixTypeNode } from './SizePrefixTypeNode';
import type { TypeNode } from './TypeNode';

export type NestedTypeNode<TType extends TypeNode> =
    | FixedSizeTypeNode<NestedTypeNode<TType>>
    | HiddenPrefixTypeNode<NestedTypeNode<TType>>
    | HiddenSuffixTypeNode<NestedTypeNode<TType>>
    | PostOffsetTypeNode<NestedTypeNode<TType>>
    | PreOffsetTypeNode<NestedTypeNode<TType>>
    | SentinelTypeNode<NestedTypeNode<TType>>
    | SizePrefixTypeNode<NestedTypeNode<TType>>
    | TType;
