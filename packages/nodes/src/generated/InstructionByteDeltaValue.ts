/**
 * The value forms accepted by an `instructionByteDeltaNode`.
 * An `accountLinkNode` uses the size of the linked account; an `argumentValueNode` uses the value of the referenced instruction argument; a `numberValueNode` uses that explicit number; and a `resolverValueNode` acts as a fallback for more complex values.
 */
export const INSTRUCTION_BYTE_DELTA_VALUE_KINDS = [
    'accountLinkNode' as const,
    'argumentValueNode' as const,
    'numberValueNode' as const,
    'resolverValueNode' as const,
];
