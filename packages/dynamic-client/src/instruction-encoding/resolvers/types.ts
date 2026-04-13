import type { InstructionNode, RootNode } from 'codama';

import type { AccountsInput, ArgumentsInput, ResolversInput } from '../../shared/types';

// Array of node names being resolved to detect circular dependencies.
export type ResolutionPath = readonly string[];

/**
 * Shared context threaded through the account/PDA resolution pipeline.
 * Individual resolvers/visitors extend this with domain-specific fields.
 */
export type BaseResolutionContext = {
    accountsInput: AccountsInput | undefined;
    argumentsInput: ArgumentsInput | undefined;
    ixNode: InstructionNode;
    resolutionPath: ResolutionPath;
    resolversInput: ResolversInput | undefined;
    root: RootNode;
};
