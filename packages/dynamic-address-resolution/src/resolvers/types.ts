import type { InstructionNode, RootNode } from 'codama';

import type { AccountsInput, ArgumentsInput, ResolverFnInput, ResolversInput } from '../shared/types';

// Array of node names being resolved to detect circular dependencies.
export type ResolutionPath = readonly string[];

/**
 * Shared context threaded through the account/PDA resolution pipeline.
 * Individual resolvers/visitors extend this with domain-specific fields.
 */
export type BaseResolutionContext<
    TAccounts extends AccountsInput = AccountsInput,
    TArgs extends ArgumentsInput = ArgumentsInput,
    TResolvers extends ResolverFnInput = ResolversInput,
> = {
    accountsInput: TAccounts | undefined;
    argumentsInput: TArgs | undefined;
    ixNode: InstructionNode;
    resolutionPath: ResolutionPath;
    resolversInput: TResolvers | undefined;
    root: RootNode;
};
