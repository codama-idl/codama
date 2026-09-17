import type { DataValueNode } from './contextualValueNodes/DataValueNode';
import type { AccountLinkNode } from './linkNodes/AccountLinkNode';
import type { IntegerValueNode } from './valueNodes/IntegerValueNode';

/**
 * The value forms accepted by an `instructionByteDeltaNode`.
 * An `accountLinkNode` uses the size of the linked account; a `dataValueNode` uses a value within the instruction data; and an `integerValueNode` uses that explicit number.
 */
export type InstructionByteDeltaValue = AccountLinkNode | DataValueNode | IntegerValueNode;
