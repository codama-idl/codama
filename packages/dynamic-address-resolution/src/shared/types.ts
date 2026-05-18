import type { AddressInput } from './address';

export type AccountsInput = Partial<Record<string, AddressInput | null | undefined>>;
export type ArgumentsInput = Partial<Record<string, unknown>>;

// Custom Resolvers for ResolverValueNode
export type ResolverFn<TArgs = ArgumentsInput, TAccounts = AccountsInput> = (
    argumentsInput: TArgs,
    accountsInput: TAccounts,
) => Promise<unknown>;
export type ResolversInput = Record<string, ResolverFn>;

/**
 * Generic constraint for resolver-record type parameters across the address-resolution pipeline.
 * Uses `ResolverFn<any, any>` to bypass the contravariance — a narrowed
 * `ResolverFn<SpecificArgs, SpecificAccounts>` would not satisfy `Record<string, ResolverFn<ArgumentsInput, AccountsInput>>`,
 * but it does satisfy `Record<string, ResolverFn<any, any>>`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
export type ResolverFnInput = Record<string, ResolverFn<any, any>>;
