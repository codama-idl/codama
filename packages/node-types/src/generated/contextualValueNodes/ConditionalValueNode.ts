import type { ValueNode } from '../valueNodes/ValueNode';
import type { ConditionalValueCondition } from './ConditionalValueCondition';
import type { InstructionInputValueNode } from './InstructionInputValueNode';

/**
 * A branching contextual value.
 * The condition resolves to a value at instruction time; that result selects between `ifTrue` and `ifFalse`.
 */
export interface ConditionalValueNode<
    TCondition extends ConditionalValueCondition = ConditionalValueCondition,
    TValue extends ValueNode | undefined = ValueNode | undefined,
    TIfTrue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
    TIfFalse extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
> {
    readonly kind: 'conditionalValueNode';

    // Children.
    /** The value whose evaluation drives the branch. */
    readonly condition: TCondition;
    /**
     * When present, the condition result is compared for equality against this value.
     * When omitted, the condition passes if the referenced account or argument exists in the current context, regardless of its value.
     */
    readonly value?: TValue;
    /** The value used when the condition passes — i.e. it matches `value` or, without a `value`, exists. */
    readonly ifTrue?: TIfTrue;
    /** The value used when the condition fails — i.e. it does not match `value` or, without a `value`, does not exist. */
    readonly ifFalse?: TIfFalse;
}
