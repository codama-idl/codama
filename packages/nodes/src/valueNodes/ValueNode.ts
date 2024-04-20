// Standalone Value Node Registration.
export const STANDALONE_VALUE_NODE_KINDS = [
    'arrayValueNode' as const,
    'bytesValueNode' as const,
    'booleanValueNode' as const,
    'constantValueNode' as const,
    'enumValueNode' as const,
    'mapValueNode' as const,
    'noneValueNode' as const,
    'numberValueNode' as const,
    'setValueNode' as const,
    'someValueNode' as const,
    'structValueNode' as const,
    'tupleValueNode' as const,
    'publicKeyValueNode' as const,
    'stringValueNode' as const,
];

// Value Node Registration.
export const REGISTERED_VALUE_NODE_KINDS = [
    ...STANDALONE_VALUE_NODE_KINDS,
    'mapEntryValueNode' as const,
    'structFieldValueNode' as const,
];

// Value Node Helpers.
export const VALUE_NODES = STANDALONE_VALUE_NODE_KINDS;
