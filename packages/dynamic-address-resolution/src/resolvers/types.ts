import type { InstructionNode, LinkableDictionary, NodePath, ProvidedScope } from 'codama';

import type { AccountsInput, DataInput, FetchAccountsFn } from '../shared/types';

/**
 * The accounts being resolved, by identifier, and the data fields whose default values are being
 * resolved, as `data.` followed by their path, used to detect circular dependencies.
 */
export type ResolutionPath = readonly string[];

/**
 * Shared context threaded through the account and PDA resolution pipeline.
 * Individual resolvers and visitors extend it with domain-specific fields.
 */
export type ResolutionContext<TAccounts extends AccountsInput = AccountsInput, TData extends DataInput = DataInput> = {
    accountsInput: TAccounts | undefined;
    dataInput: TData | undefined;
    /** Fetches the accounts whose data is read, batched and cached, see `getBatchedFetchAccounts`. */
    fetchAccounts: FetchAccountsFn | undefined;
    /** The path of the instruction whose accounts are resolved, from the root node. */
    instructionPath: NodePath<InstructionNode>;
    /** Used to follow links, e.g. to PDAs, defined types or programs. */
    linkables: LinkableDictionary;
    /** The accounts and data fields being resolved, used to detect circular dependencies. */
    resolutionPath: ResolutionPath;
    /** The values provided by the instruction and its parents, used to resolve injected values. */
    scope: ProvidedScope;
};
