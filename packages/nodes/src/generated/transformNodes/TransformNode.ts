/**
 * A modifier applied to the serialisation of the type node that carries it.
 * Every type node has an optional `transforms` array. Transforms apply in array order, the first being the innermost: a `stringTypeNode` with `transforms: [sentinel, fixedSize]` first delimits the string with the sentinel, then fixes the total byte size — exactly the v1 nesting `fixedSizeTypeNode(sentinelTypeNode(stringTypeNode))` read inside-out.
 */
export const TRANSFORM_NODE_KINDS = [
    'fixedSizeTransformNode' as const,
    'hiddenPrefixTransformNode' as const,
    'hiddenSuffixTransformNode' as const,
    'postOffsetTransformNode' as const,
    'preOffsetTransformNode' as const,
    'sentinelTransformNode' as const,
    'sizePrefixTransformNode' as const,
];
