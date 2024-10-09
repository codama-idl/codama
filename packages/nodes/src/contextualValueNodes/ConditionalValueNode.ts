import type {
    AccountValueNode,
    ArgumentValueNode,
    ConditionalValueNode,
    InstructionInputValueNode,
    ResolverValueNode,
    ValueNode,
} from '@codama/node-types';

type ConditionNode = AccountValueNode | ArgumentValueNode | ResolverValueNode;

export function conditionalValueNode<
    TCondition extends ConditionNode,
    TValue extends ValueNode | undefined = undefined,
    TIfTrue extends InstructionInputValueNode | undefined = undefined,
    TIfFalse extends InstructionInputValueNode | undefined = undefined,
>(input: {
    condition: TCondition;
    ifFalse?: TIfFalse;
    ifTrue?: TIfTrue;
    value?: TValue;
}): ConditionalValueNode<TCondition, TValue, TIfTrue, TIfFalse> {
    return Object.freeze({
        kind: 'conditionalValueNode',

        // Children.
        condition: input.condition,
        ...(input.value !== undefined && { value: input.value }),
        ...(input.ifTrue !== undefined && { ifTrue: input.ifTrue }),
        ...(input.ifFalse !== undefined && { ifFalse: input.ifFalse }),
    });
}
