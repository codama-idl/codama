import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs';
import type { ProvidedNode } from 'codama';

/**
 * Fetches the on-chain account at a given address, returning Kit's `MaybeEncodedAccount` — an
 * `exists` flag plus, when the account exists, the raw account bytes and its on-chain metadata.
 *
 * Consumers simply forward what an RPC returns (e.g. `fetchEncodedAccount`) — no decoding required.
 * The display layer decodes the bytes itself using the referenced account's `accountLink` from the
 * IDL. Required to resolve display values that live in account state — e.g. a token's
 * `decimals`/`symbol` injected via the provide/inject pattern. When omitted, such values fall back
 * to their declared `fallback` (when present) or are treated as unresolvable.
 *
 * The eventual offline / hardware-wallet path can back this callback with a pre-fetched metadata
 * bundle instead of live RPC.
 */
export type FetchAccountFn = (address: Address) => Promise<MaybeEncodedAccount>;

/**
 * Decodes the raw bytes of a named instruction account against its `accountLink` layout, returning
 * the decoded record or `null` when the account carries no link or cannot be decoded.
 *
 * The IDL already describes how to decode a linked account, so decoding is done for the consumer
 * rather than asked of them. The orchestrator backs this with a `LinkableDictionary` populated from
 * the root.
 */
export type ResolveAccountDataFn = (accountName: string, bytes: ReadonlyUint8Array) => Record<string, unknown> | null;

/**
 * The contextual environment in which display values are resolved.
 *
 * Mirrors the provide/inject pattern: an instruction (or other host) exposes named values
 * through `provides`, and reusable types pull them by key via `injectedValueNode`. Resolving
 * those keys reads from the surrounding `parsedInstruction` (its decoded arguments and account
 * addresses) and, for account state, the `fetchAccount` hook plus `resolveAccountData` decoder.
 *
 * The orchestrator assembles this from a parsed instruction; it is kept explicit here so the
 * resolution and formatting layers can be exercised in isolation.
 */
export type DisplayResolutionContext = {
    /** Fetches the on-chain account at an address; absent when running fully offline. */
    readonly fetchAccount?: FetchAccountFn;
    /** The parsed instruction being presented: its decoded arguments, node path, and account metas. */
    readonly parsedInstruction: ParsedInstruction;
    /** Values exposed by the surrounding host, keyed by the name they are provided under. */
    readonly provides: ReadonlyMap<string, ProvidedNode>;
    /** Decodes a named account's raw bytes against its `accountLink` layout. */
    readonly resolveAccountData: ResolveAccountDataFn;
};
