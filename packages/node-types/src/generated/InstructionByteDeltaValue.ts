import type { ArgumentValueNode } from './contextualValueNodes/ArgumentValueNode';
import type { ResolverValueNode } from './contextualValueNodes/ResolverValueNode';
import type { AccountLinkNode } from './linkNodes/AccountLinkNode';
import type { NumberValueNode } from './valueNodes/NumberValueNode';

/**
 * The value forms accepted by an `instructionByteDeltaNode`.
 * An `accountLinkNode` uses the size of the linked account; an `argumentValueNode` uses the value of the referenced instruction argument; a `numberValueNode` uses that explicit number; and a `resolverValueNode` acts as a fallback for more complex values.
 */
export type InstructionByteDeltaValue = AccountLinkNode | ArgumentValueNode | NumberValueNode | ResolverValueNode;
