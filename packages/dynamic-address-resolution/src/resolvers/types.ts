import type { InstructionNode, LinkableDictionary, NodePath, ProvidedScope } from 'codama';

import type { AccountsInput, DataInput } from '../shared/types';

/** The identifiers of the accounts being resolved, used to detect circular dependencies. */
export type ResolutionPath = readonly string[];

/**
 * Shared context threaded through the account and PDA resolution pipeline.
 * Individual resolvers and visitors extend it with domain-specific fields.
 */
export type ResolutionContext<TAccounts extends AccountsInput = AccountsInput, TData extends DataInput = DataInput> = {
    accountsInput: TAccounts | undefined;
    dataInput: TData | undefined;
    /** The path of the instruction whose accounts are resolved, from the root node. */
    instructionPath: NodePath<InstructionNode>;
    /** Used to follow links, e.g. to PDAs, defined types or programs. */
    linkables: LinkableDictionary;
    resolutionPath: ResolutionPath;
    /** The values provided by the instruction and its parents, used to resolve injected values. */
    scope: ProvidedScope;
};
