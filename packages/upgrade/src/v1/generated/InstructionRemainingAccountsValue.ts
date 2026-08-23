import type { ArgumentValueNode } from './contextualValueNodes/ArgumentValueNode';
import type { ResolverValueNode } from './contextualValueNodes/ResolverValueNode';

/**
 * The value forms accepted by an `instructionRemainingAccountsNode`.
 * An `argumentValueNode` represents the array of accounts as a new argument of the provided name; a `resolverValueNode` acts as a fallback for more complex scenarios.
 */
export type InstructionRemainingAccountsValue = ArgumentValueNode | ResolverValueNode;
