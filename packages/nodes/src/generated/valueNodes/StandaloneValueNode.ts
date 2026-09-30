/** Every value node that can be used as a top-level value. */
export const STANDALONE_VALUE_NODE_KINDS = [
    'arrayValueNode' as const,
    'booleanValueNode' as const,
    'bytesValueNode' as const,
    'constantValueNode' as const,
    'enumValueNode' as const,
    'floatValueNode' as const,
    'injectedValueNode' as const,
    'integerValueNode' as const,
    'mapValueNode' as const,
    'noneValueNode' as const,
    'publicKeyValueNode' as const,
    'setValueNode' as const,
    'someValueNode' as const,
    'stringValueNode' as const,
    'structValueNode' as const,
    'tupleValueNode' as const,
];
