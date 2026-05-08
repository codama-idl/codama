import type { ArgumentValueNode } from './contextualValueNodes/ArgumentValueNode';
import type { ResolverValueNode } from './contextualValueNodes/ResolverValueNode';

/** The value forms accepted by an `instructionRemainingAccountsNode`. */
export type InstructionRemainingAccountsValue = ArgumentValueNode | ResolverValueNode;
