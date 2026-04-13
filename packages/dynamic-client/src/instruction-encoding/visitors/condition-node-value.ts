import { CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER, CodamaError } from '@codama/errors';
import type { Visitor } from 'codama';
import type { AccountValueNode, ArgumentValueNode, ResolverValueNode } from 'codama';

import { resolveAccountValueNodeAddress } from '../resolvers/resolve-account-value-node-address';
import type { BaseResolutionContext } from '../resolvers/types';

export const CONDITION_NODE_SUPPORTED_NODE_KINDS = [
    'accountValueNode',
    'argumentValueNode',
    'resolverValueNode',
] as const;

type ConditionNodeSupportedNodeKind = (typeof CONDITION_NODE_SUPPORTED_NODE_KINDS)[number];

/**
 * Visitor for resolving condition nodes in ConditionalValueNode.
 * Returns the runtime value of the condition (from accounts or arguments).
 */
export function createConditionNodeValueVisitor(
    ctx: BaseResolutionContext,
): Visitor<Promise<unknown>, ConditionNodeSupportedNodeKind> {
    const { root, ixNode, argumentsInput, accountsInput, resolutionPath, resolversInput } = ctx;

    return {
        visitAccountValue: async (node: AccountValueNode) => {
            // If the user explicitly provides null for a conditional account,
            // return it for the conditionalValueNode ifFalse branch.
            const accountAddressInput = accountsInput?.[node.name];
            if (accountAddressInput === null) {
                return null;
            }

            return await resolveAccountValueNodeAddress(node, {
                accountsInput,
                argumentsInput,
                ixNode,
                resolutionPath,
                resolversInput,
                root,
            });
        },

        visitArgumentValue: async (node: ArgumentValueNode) => {
            const argInput = argumentsInput?.[node.name];
            return await Promise.resolve(argInput);
        },

        visitResolverValue: async (node: ResolverValueNode) => {
            const resolverFn = resolversInput?.[node.name];
            if (!resolverFn) {
                // ConditionalValueNode evaluates condition and based on result it chooses to take either ifTrue or ifFalse branch.
                // If resolver is not provided, we assume condition is false and return undefined instead of throwing an error to take ifFalse branch.
                return undefined;
            }
            try {
                return await resolverFn(argumentsInput ?? {}, accountsInput ?? {});
            } catch (error) {
                throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER, {
                    cause: error,
                    resolverName: node.name,
                    targetKind: 'conditionalValueNode',
                    targetName: node.name,
                });
            }
        },
    };
}
