import type { ArgumentValueNode } from './contextualValueNodes/ArgumentValueNode';
import type { ResolverValueNode } from './contextualValueNodes/ResolverValueNode';
import type { AccountLinkNode } from './linkNodes/AccountLinkNode';
import type { NumberValueNode } from './valueNodes/NumberValueNode';

/** The value forms accepted by an `instructionByteDeltaNode`. */
export type InstructionByteDeltaValue = AccountLinkNode | ArgumentValueNode | NumberValueNode | ResolverValueNode;
