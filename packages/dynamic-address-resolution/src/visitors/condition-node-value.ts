import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';
import type { Node, Visitor } from 'codama';

import { getAccountInput, getDataValue, getInstruction } from '../resolvers/context';
import { resolveAccountValueNodeAddress } from '../resolvers/resolve-account-value-node-address';
import type { ResolutionContext } from '../resolvers/types';

export const CONDITION_NODE_SUPPORTED_NODE_KINDS = ['accountValueNode', 'dataValueNode'] as const;

type ConditionNodeSupportedNodeKind = (typeof CONDITION_NODE_SUPPORTED_NODE_KINDS)[number];

export function unexpectedConditionNode(node: Node): never {
    throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
        expectedKinds: [...CONDITION_NODE_SUPPORTED_NODE_KINDS],
        kind: node.kind,
        node,
    });
}

/** Visitor resolving the condition of a `conditionalValueNode` to its runtime value. */
export function createConditionNodeValueVisitor(
    ctx: ResolutionContext,
): Visitor<Promise<unknown>, ConditionNodeSupportedNodeKind> {
    return {
        visitAccountValue: async node => {
            // An account explicitly provided as null does not exist.
            const input = getAccountInput(ctx, node.identifier);
            if (input === null) return null;
            // Neither does an account that is not provided and cannot be resolved from a default value.
            const account = (getInstruction(ctx).accounts ?? []).find(
                account => account.identifier === node.identifier,
            );
            if (input === undefined && account && account.defaultValue === undefined) return undefined;
            return await resolveAccountValueNodeAddress(node, ctx);
        },

        visitDataValue: node => Promise.resolve(getDataValue(ctx, node.path)),
    };
}
