import type { Account } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import type { ProvidedNode } from 'codama';

/**
 * Fetches and decodes the account at a given address, returning Kit's decoded `Account`
 * (whose `data` is the decoded layout) or `null` when the account does not exist.
 *
 * Required to resolve display values that live in account state — e.g. a token's
 * `decimals`/`symbol` injected via the provide/inject pattern, or interpolation paths
 * such as `${accounts.destination.data.owner}`. When omitted, such values fall back to
 * their declared `fallback` (when present) or are treated as unresolvable.
 *
 * The eventual offline / hardware-wallet path can back this callback with a pre-fetched
 * metadata bundle instead of live RPC.
 */
export type FetchAccountDataFn = (address: Address) => Promise<Account<object> | null>;

/**
 * The contextual environment in which display values are resolved.
 *
 * Mirrors the provide/inject pattern: an instruction (or other host) exposes named values
 * through `provides`, and reusable types pull them by key via `injectedValueNode`. Resolving
 * those keys may also require reading account state, so the context carries the addresses of
 * the surrounding instruction's accounts plus the `fetchAccountData` hook.
 *
 * The orchestrator assembles this from a parsed instruction; it is kept explicit here so the
 * resolution and formatting layers can be exercised in isolation.
 */
export type DisplayResolutionContext = {
    /** Addresses of the surrounding instruction's accounts, keyed by account name. */
    readonly accountAddresses: ReadonlyMap<string, Address>;
    /** Fetches and decodes account data; absent when running fully offline. */
    readonly fetchAccountData?: FetchAccountDataFn;
    /** Values exposed by the surrounding host, keyed by the name they are provided under. */
    readonly provides: ReadonlyMap<string, ProvidedNode>;
};
