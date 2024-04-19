import type { ArgumentValueNode, ResolverValueNode } from './contextualValueNodes';
import type { AccountLinkNode } from './linkNodes';
import type { NumberValueNode } from './valueNodes';

type InstructionByteDeltaNodeValue = AccountLinkNode | ArgumentValueNode | NumberValueNode | ResolverValueNode;

export interface InstructionByteDeltaNode<
    TValue extends InstructionByteDeltaNodeValue = InstructionByteDeltaNodeValue,
> {
    readonly kind: 'instructionByteDeltaNode';

    // Data.
    readonly withHeader: boolean;
    readonly subtract?: boolean;

    // Children.
    readonly value: TValue;
}
