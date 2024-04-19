import type { ValueNode } from '../valueNodes';
import type { AccountValueNode } from './AccountValueNode';
import type { ArgumentValueNode } from './ArgumentValueNode';
import type { InstructionInputValueNode } from './ContextualValueNode';
import type { ResolverValueNode } from './ResolverValueNode';

type ConditionNode = AccountValueNode | ArgumentValueNode | ResolverValueNode;
type ConditionStatementNode = InstructionInputValueNode;

export interface ConditionalValueNode<
    TCondition extends ConditionNode = ConditionNode,
    TValue extends ValueNode | undefined = ValueNode | undefined,
    TIfTrue extends ConditionStatementNode | undefined = ConditionStatementNode | undefined,
    TIfFalse extends ConditionStatementNode | undefined = ConditionStatementNode | undefined,
> {
    readonly kind: 'conditionalValueNode';

    // Children.
    readonly condition: TCondition;
    readonly value?: TValue;
    readonly ifTrue?: TIfTrue;
    readonly ifFalse?: TIfFalse;
}
