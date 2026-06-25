import type { Account } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import type { DefinedTypeLinkNode, DefinedTypeNode, InstructionNode, ProvidedNode } from 'codama';

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
 * A single context threaded through the whole display layer: the static `instruction`
 * definition, its decoded argument `data` (a flat record keyed by argument name), the
 * concrete account addresses (keyed by account name; the instruction supplies their order),
 * the provide/inject graph, account fetching, and link resolution. Lower-level helpers read
 * only the parts they need.
 *
 * The orchestrator assembles this from a parsed instruction; it is kept explicit so every
 * layer can be exercised in isolation.
 */
export type DisplayContext = {
    /** Concrete account addresses, keyed by account name. */
    readonly accountAddresses: ReadonlyMap<string, Address>;
    /** The decoded argument values, keyed by argument name. */
    readonly data: Record<string, unknown>;
    /** Fetches and decodes account data; absent when running fully offline. */
    readonly fetchAccountData?: FetchAccountDataFn;
    /** The static instruction definition being presented. */
    readonly instruction: InstructionNode;
    /** Values exposed by the surrounding host, keyed by the name they are provided under. */
    readonly provides: ReadonlyMap<string, ProvidedNode>;
    /** Resolves any `definedTypeLinkNode` reached while following an argument's type. */
    readonly resolveDefinedType: ResolveDefinedTypeFn;
};
