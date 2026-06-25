import type { Account } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import type { DefinedTypeLinkNode, DefinedTypeNode, InstructionNode, NodePath, ProvidedNode } from 'codama';

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
    /** Fetches and decodes account data needed to resolve display values. */
    readonly fetchAccountData?: FetchAccountDataFn;
};

/**
 * Everything needed to present one concrete instruction.
 *
 * A single context threaded through the whole display layer. Helpers that run before the full
 * context exists — e.g. the consumed-member computation — accept
 * `Omit<DisplayContext, 'consumedMemberNames'>`.
 *
 * The orchestrator assembles this from a parsed instruction; it is kept explicit so every layer
 * can be exercised in isolation.
 */
export type DisplayContext = {
    /** Concrete account addresses, keyed by account name. */
    readonly accountAddresses: ReadonlyMap<string, Address>;
    /**
     * Names of members (accounts or arguments) whose value was surfaced elsewhere through the
     * provide/inject graph. Used to hide `whenInjected` members whose value the display already
     * presented indirectly (e.g. a mint hidden because its decimals were injected into an amount).
     */
    readonly consumedMemberNames: ReadonlySet<string>;
    /** The decoded argument values, keyed by argument name. */
    readonly data: Record<string, unknown>;
    /** Fetches and decodes account data; absent when running fully offline. */
    readonly fetchAccountData?: FetchAccountDataFn;
    /** The path locating the instruction within its root (`[root, program, instruction]`). */
    readonly instructionPath: NodePath<InstructionNode>;
    /** Values exposed by the surrounding host, keyed by the name they are provided under. */
    readonly provides: ReadonlyMap<string, ProvidedNode>;
    /** Resolves a `definedTypeLinkNode` (by its full path) reached while following a type. */
    readonly resolveDefinedType: ResolveDefinedTypeFn;
};
