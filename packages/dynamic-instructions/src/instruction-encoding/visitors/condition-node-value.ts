import type { Visitor } from 'codama';
import type { AccountValueNode, ArgumentValueNode, ResolverValueNode } from 'codama';

import { ResolverError } from '../../shared/errors';
import { resolveAccountValueNodeAddress } from '../resolvers/resolve-account-value-node-address';
import type { BaseResolutionContext } from '../resolvers/types';

/**
 * Visitor for resolving condition nodes in ConditionalValueNode.
 * Returns the runtime value of the condition (from accounts or arguments).
 */
export function createConditionNodeValueVisitor(
    ctx: BaseResolutionContext,
): Visitor<Promise<unknown>, 'accountValueNode' | 'argumentValueNode' | 'resolverValueNode'> {
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
                throw new ResolverError(`Resolver "${node.name}" threw an error while evaluating condition`, {
                    cause: error,
                });
            }
        },
    };
}
