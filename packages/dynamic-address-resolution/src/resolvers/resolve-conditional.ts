import { CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, CodamaError } from '@codama/errors';
import type { ConditionalValueNode, InstructionAccountNode, InstructionInputValueNode } from 'codama';
import { visitOrElse } from 'codama';

import { isValueEqual } from '../shared/util';
import { createConditionNodeValueVisitor, unexpectedConditionNode } from '../visitors/condition-node-value';
import { getInstruction, getValue } from './context';
import type { ResolutionContext } from './types';

/**
 * Evaluate the condition of a `conditionalValueNode` and return the matching
 * branch, or `undefined` when that branch is not defined.
 *
 * With a `value`, the condition passes when it equals that value, e.g. `2`
 * equals `integerValueNode('2')`. Without a `value`, it passes when the
 * referenced account or data exists.
 */
export async function resolveConditionalValueNodeCondition(
    conditionalValueNode: ConditionalValueNode,
    ixAccountNode: InstructionAccountNode,
    ctx: ResolutionContext,
): Promise<InstructionInputValueNode | undefined> {
    const { condition, value, ifTrue, ifFalse } = conditionalValueNode;
    if (!value && !ifTrue && !ifFalse) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: `Invalid conditionalValueNode: missing value and branches for account ${ixAccountNode.identifier} in ${getInstruction(ctx).identifier}`,
        });
    }

    const actual = await visitOrElse(condition, createConditionNodeValueVisitor(ctx), unexpectedConditionNode);
    const passes = value
        ? isValueEqual(actual, getValue(ctx, ctx.instructionPath, value))
        : actual !== undefined && actual !== null;
    return passes ? ifTrue : ifFalse;
}
