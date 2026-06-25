import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs';
import type { DefinedTypeLinkNode, DefinedTypeNode, NodePath, ProvidedNode } from 'codama';

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
 * Resolves a `definedTypeLinkNode` (addressed by its full path) to the path of its underlying
 * `DefinedTypeNode`, or `undefined` when the link cannot be resolved.
 *
 * The input path locates the link within the tree so the linkable dictionary can resolve it
 * against the correct program. Returning the resolved node's *path* (rather than just the node)
 * lets callers continue resolving links nested inside it from the correct location — including
 * links that cross into another program.
 *
 * The orchestrator backs this with a `LinkableDictionary` populated from the root; tests can
 * supply a simple map-backed resolver.
 */
export type ResolveDefinedTypeFn = (linkPath: NodePath<DefinedTypeLinkNode>) => NodePath<DefinedTypeNode> | undefined;

/** A single labelled field of the fallback display list (e.g. `{ label: 'Amount', value: '1.5 USDC' }`). */
export type DisplayField = {
    /** The human-readable label for the field. */
    readonly label: string;
    /** The formatted value for the field. */
    readonly value: string;
};

/**
 * The human-readable presentation of one concrete instruction.
 *
 * Carries both display modes so the renderer can choose: a short `intent` label, the
 * `interpolatedIntent` sentence (or `null` when it cannot be fully resolved), and the
 * structured `fields` fallback list. Presentation strategy is left to the renderer.
 */
export type InstructionDisplay = {
    /** The structured fallback list of labelled fields for the instruction's members. */
    readonly fields: DisplayField[];
    /** A short imperative label (e.g. `"Transfer"`); derived from the instruction name when absent. */
    readonly intent: string;
    /** The resolved interpolated sentence, or `null` when a placeholder could not be resolved. */
    readonly interpolatedIntent: string | null;
};

/** Consumer-supplied hooks that enrich the generated display. */
export type GetInstructionDisplayOptions = {
    /** Fetches the on-chain account needed to resolve display values that live in account state. */
    readonly fetchAccount?: FetchAccountFn;
};

/**
 * Everything needed to present one concrete instruction.
 *
 * A single context threaded through the whole display layer: the parsed instruction (its decoded
 * arguments, node path, and account metas), the provide/inject graph, account fetching + decoding,
 * link resolution, and the members already surfaced through provide/inject. Helpers that run before
 * the full context exists — e.g. the consumed-member computation — accept
 * `Omit<DisplayContext, 'consumedMemberNames'>`.
 *
 * The orchestrator assembles this from a parsed instruction; it is kept explicit so every layer
 * can be exercised in isolation.
 */
export type DisplayContext = {
    /**
     * Names of members (accounts or arguments) whose value was surfaced elsewhere through the
     * provide/inject graph. Used to hide `whenInjected` members whose value the display already
     * presented indirectly (e.g. a mint hidden because its decimals were injected into an amount).
     */
    readonly consumedMemberNames: ReadonlySet<string>;
    /** Fetches the on-chain account at an address; absent when running fully offline. */
    readonly fetchAccount?: FetchAccountFn;
    /** The parsed instruction being presented: its decoded arguments, node path, and account metas. */
    readonly parsedInstruction: ParsedInstruction;
    /** Values exposed by the surrounding host, keyed by the name they are provided under. */
    readonly provides: ReadonlyMap<string, ProvidedNode>;
    /** Decodes a named account's raw bytes against its `accountLink` layout. */
    readonly resolveAccountData: ResolveAccountDataFn;
    /** Resolves a `definedTypeLinkNode` (by its full path) reached while following a type. */
    readonly resolveDefinedType: ResolveDefinedTypeFn;
};
