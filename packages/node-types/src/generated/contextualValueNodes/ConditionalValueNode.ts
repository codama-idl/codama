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
     * Otherwise the result is treated as a boolean.
     */
    readonly value?: TValue;
    /** The value used when the condition resolves truthy (or matches `value`). */
    readonly ifTrue?: TIfTrue;
    /** The value used when the condition resolves falsy (or does not match `value`). */
    readonly ifFalse?: TIfFalse;
}
