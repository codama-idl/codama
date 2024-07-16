// Standalone Type Node Registration.
export const STANDALONE_TYPE_NODE_KINDS = [
    'amountTypeNode' as const,
    'arrayTypeNode' as const,
    'booleanTypeNode' as const,
    'bytesTypeNode' as const,
    'dateTimeTypeNode' as const,
    'enumTypeNode' as const,
    'fixedSizeTypeNode' as const,
    'hiddenPrefixTypeNode' as const,
    'hiddenSuffixTypeNode' as const,
    'mapTypeNode' as const,
    'numberTypeNode' as const,
    'optionTypeNode' as const,
    'postOffsetTypeNode' as const,
    'preOffsetTypeNode' as const,
    'publicKeyTypeNode' as const,
    'remainderOptionTypeNode' as const,
    'sentinelTypeNode' as const,
    'setTypeNode' as const,
    'sizePrefixTypeNode' as const,
    'solAmountTypeNode' as const,
    'stringTypeNode' as const,
    'structTypeNode' as const,
    'tupleTypeNode' as const,
    'zeroableOptionTypeNode' as const,
];

// Type Node Registration.
export const REGISTERED_TYPE_NODE_KINDS = [
    ...STANDALONE_TYPE_NODE_KINDS,
    'structFieldTypeNode' as const,
    'enumEmptyVariantTypeNode' as const,
    'enumStructVariantTypeNode' as const,
    'enumTupleVariantTypeNode' as const,
];

/**
 * Type Node Helpers.
 * This only includes type nodes that can be used as standalone types.
 * E.g. this excludes structFieldTypeNode, enumEmptyVariantTypeNode, etc.
 * It also includes the definedTypeLinkNode to compose types.
 */
export const TYPE_NODES = [...STANDALONE_TYPE_NODE_KINDS, 'definedTypeLinkNode' as const];
