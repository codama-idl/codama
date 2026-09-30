/**
 * The value forms accepted by an `instructionByteDeltaNode`.
 * An `accountLinkNode` uses the size of the linked account; a `dataValueNode` uses a value within the instruction data; and an `integerValueNode` uses that explicit number.
 */
export const INSTRUCTION_BYTE_DELTA_VALUE_KINDS = [
    'accountLinkNode' as const,
    'dataValueNode' as const,
    'integerValueNode' as const,
];
