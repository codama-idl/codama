import {
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CodamaError,
} from '@codama/errors';
import type { ConditionalValueNode, InstructionAccountNode, InstructionInputValueNode } from 'codama';
import { isNode, visitOrElse } from 'codama';

import { getMaybeNodeKind } from '../../shared/util';
import { CONDITION_NODE_SUPPORTED_NODE_KINDS, createConditionNodeValueVisitor } from '../visitors/condition-node-value';
import { createValueNodeVisitor, VALUE_NODE_SUPPORTED_NODE_KINDS } from '../visitors/value-node-value';
import type { BaseResolutionContext } from './types';

export type ResolveConditionalContext = BaseResolutionContext & {
    conditionalValueNode: ConditionalValueNode;
    ixAccountNode: InstructionAccountNode;
};

/**
 * Evaluates a ConditionalValueNode's condition.
 * Returns the matching branch (ifTrue or ifFalse) as an InstructionInputValueNode or undefined if no branch matches.
 */
export async function resolveConditionalValueNodeCondition({
    root,
    ixNode,
    ixAccountNode,
    conditionalValueNode,
    argumentsInput,
    accountsInput,
    resolutionPath,
    resolversInput,
}: ResolveConditionalContext): Promise<InstructionInputValueNode | undefined> {
    if (!isNode(conditionalValueNode, 'conditionalValueNode')) {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: ['conditionalValueNode'],
            kind: getMaybeNodeKind(conditionalValueNode),
            node: conditionalValueNode,
        });
    }
    const { condition, value: expectedValueNode, ifTrue, ifFalse } = conditionalValueNode;

    if (!expectedValueNode && !ifTrue && !ifFalse) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: `Invalid conditionalValueNode: missing value and branches for account ${ixAccountNode.name} in ${ixNode.name}`,
        });
    }

    // Resolve the condition value of ConditionalValueNode.
    const conditionVisitor = createConditionNodeValueVisitor({
        accountsInput,
        argumentsInput,
        ixNode,
        resolutionPath,
        resolversInput,
        root,
    });
    const actualProvidedValue = await visitOrElse(condition, conditionVisitor, condNode => {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: [...CONDITION_NODE_SUPPORTED_NODE_KINDS],
            kind: condNode.kind,
            node: condNode,
        });
    });

    if (!expectedValueNode) {
        return actualProvidedValue ? ifTrue : ifFalse;
    }

    // If expectedValueNode exists, the condition must be equal to expected value.
    const valueVisitor = createValueNodeVisitor();
    const expectedValue = visitOrElse(expectedValueNode, valueVisitor, valueNode => {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: [...VALUE_NODE_SUPPORTED_NODE_KINDS],
            kind: valueNode.kind,
            node: valueNode,
        });
    });

    if (typeof expectedValue.value === 'object' || typeof actualProvidedValue === 'object') {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: 'Deep equality comparison not yet supported for conditional value',
        });
    }

    return actualProvidedValue === expectedValue.value ? ifTrue : ifFalse;
}
