import type {
    AccountsInput,
    ArgumentsInput,
    ResolverFn,
    ResolverFnInput,
    ResolversInput,
} from '@codama/dynamic-address-resolution';
import { CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER, CodamaError } from '@codama/errors';
import type { InstructionNode } from 'codama';
import { isNode } from 'codama';

import { isOmittedArgument } from './shared';

/**
 * Resolves argument defaults from user-provided resolvers.
 * For each argument that has a ResolverValueNode and is not provided by argumentsInput,
 * try to invoke the corresponding resolver function and fill ArgumentsInput with the resolved values.
 */
export async function resolveArgumentDefaultsFromCustomResolvers<
    TArgs extends ArgumentsInput = ArgumentsInput,
    TAccounts extends AccountsInput = AccountsInput,
    TResolvers extends ResolverFnInput = ResolversInput,
>(
    ixNode: InstructionNode,
    argumentsInput?: TArgs,
    accountsInput?: TAccounts,
    resolversInput?: TResolvers,
): Promise<TArgs> {
    const resolvedArgumentsInput: Record<string, unknown> = { ...argumentsInput };

    const allArguments = [...(ixNode.arguments ?? []), ...(ixNode.extraArguments ?? [])];
    for (const argumentNode of allArguments) {
        if (resolvedArgumentsInput[argumentNode.name] !== undefined) continue;
        if (isOmittedArgument(argumentNode)) continue;
        if (!isNode(argumentNode.defaultValue, 'resolverValueNode')) continue;

        const resolverFn: ResolverFn<TArgs, TAccounts> | undefined = resolversInput?.[argumentNode.defaultValue.name];
        // If no resolver provided — skip and let the encoding step handle it:
        // Optional arguments will be encoded as none
        // Required arguments will emit error
        if (!resolverFn) continue;

        try {
            resolvedArgumentsInput[argumentNode.name] = await resolverFn(
                resolvedArgumentsInput as TArgs,
                (accountsInput ?? {}) as TAccounts,
            );
        } catch (error) {
            throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_EXECUTE_RESOLVER, {
                cause: error,
                resolverName: argumentNode.defaultValue.name,
                targetKind: 'instructionArgumentNode',
                targetName: argumentNode.name,
            });
        }
    }

    return resolvedArgumentsInput as TArgs;
}
