import type { FixedSizeTransformNode } from './FixedSizeTransformNode';
import type { HiddenPrefixTransformNode } from './HiddenPrefixTransformNode';
import type { HiddenSuffixTransformNode } from './HiddenSuffixTransformNode';
import type { PostOffsetTransformNode } from './PostOffsetTransformNode';
import type { PreOffsetTransformNode } from './PreOffsetTransformNode';
import type { SentinelTransformNode } from './SentinelTransformNode';
import type { SizePrefixTransformNode } from './SizePrefixTransformNode';

/**
 * A modifier applied to the serialisation of the type node that carries it.
 * Every type node has an optional `transforms` array. Transforms apply in array order, the first being the innermost: a `stringTypeNode` with `transforms: [sentinel, fixedSize]` first delimits the string with the sentinel, then fixes the total byte size — exactly the v1 nesting `fixedSizeTypeNode(sentinelTypeNode(stringTypeNode))` read inside-out.
 */
export type TransformNode =
    | FixedSizeTransformNode
    | HiddenPrefixTransformNode
    | HiddenSuffixTransformNode
    | PostOffsetTransformNode
    | PreOffsetTransformNode
    | SentinelTransformNode
    | SizePrefixTransformNode;
