import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs';
import type { DefinedTypeLinkNode, DefinedTypeNode, ProvidedNode } from 'codama';

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
 * Resolves a `definedTypeLinkNode` to its underlying `DefinedTypeNode`, or `undefined` when
 * the link cannot be resolved.
 *
 * Lets the display layer follow links (e.g. an argument typed as a linked enum) without
 * depending on `NodePath` construction. The orchestrator backs this with a `LinkableDictionary`
 * populated from the root; tests can supply a simple map-backed resolver.
 */
export type ResolveDefinedTypeFn = (link: DefinedTypeLinkNode) => DefinedTypeNode | undefined;

/** A single labelled field of the fallback display list (e.g. `{ label: 'Amount', value: '1.5 USDC' }`). */
export type DisplayField = {
    /** The human-readable label for the field. */
    readonly label: string;
    /** The formatted value for the field. */
    readonly value: string;
};

/**
 * Everything needed to present one concrete instruction.
 *
 * A single context threaded through the whole display layer: the parsed instruction (its decoded
 * arguments, node path, and account metas), the provide/inject graph, account fetching + decoding,
 * and link resolution. Lower-level helpers read only the parts they need.
 *
 * The orchestrator assembles this from a parsed instruction; it is kept explicit so every
 * layer can be exercised in isolation.
 */
export type DisplayContext = {
    /** Fetches the on-chain account at an address; absent when running fully offline. */
    readonly fetchAccount?: FetchAccountFn;
    /** The parsed instruction being presented: its decoded arguments, node path, and account metas. */
    readonly parsedInstruction: ParsedInstruction;
    /** Values exposed by the surrounding host, keyed by the name they are provided under. */
    readonly provides: ReadonlyMap<string, ProvidedNode>;
    /** Decodes a named account's raw bytes against its `accountLink` layout. */
    readonly resolveAccountData: ResolveAccountDataFn;
    /** Resolves any `definedTypeLinkNode` reached while following an argument's type. */
    readonly resolveDefinedType: ResolveDefinedTypeFn;
};
