import type { ValueNode } from '../valueNodes';
import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';
import type { InstructionInputValueNode } from './ContextualValueNode';
import type { ResolverValueNode } from './ResolverValueNode';

type ConditionNode = AccountValueNode | ArgumentValueNode | ResolverValueNode;

export interface ConditionalValueNode<
    TCondition extends ConditionNode = ConditionNode,
    TValue extends ValueNode | undefined = ValueNode | undefined,
    TIfTrue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
    TIfFalse extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
> {
    readonly kind: 'conditionalValueNode';

    // Children.
    readonly condition: TCondition;
    readonly value?: TValue;
    readonly ifTrue?: TIfTrue;
    readonly ifFalse?: TIfFalse;
}
