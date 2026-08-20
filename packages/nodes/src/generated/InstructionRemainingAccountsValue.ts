/**
 * The value forms accepted by an `instructionRemainingAccountsNode`.
 * An `argumentValueNode` represents the array of accounts as a new argument of the provided name; a `resolverValueNode` acts as a fallback for more complex scenarios.
 */
export const INSTRUCTION_REMAINING_ACCOUNTS_VALUE_KINDS = ['argumentValueNode' as const, 'resolverValueNode' as const];
