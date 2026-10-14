import type { FormatDecodedNodeOptions } from '@codama/dynamic-codecs';
import type { EncodedAccount, MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';

/** A labelled row of the fallback list of an instruction, e.g. `{ label: 'Amount', value: '1.5 USDC' }`. */
export type DisplayField = {
    /** The label of the row, e.g. `"Amount"`. */
    readonly label: string;
    /** The formatted value of the row, e.g. `"1.5 USDC"`. */
    readonly value: string;
};

/**
 * The human-readable presentation of an instruction. It carries both presentation modes and
 * lets the renderer choose between the sentence and the fallback list.
 */
export type InstructionDisplay = {
    /** The rows of the fallback list: the instruction data, then its accounts and remaining accounts. */
    readonly fields: readonly DisplayField[];
    /** A short imperative label, e.g. `"Transfer"`, derived from the instruction identifier when absent. */
    readonly intent: string;
    /**
     * The interpolated sentence, e.g. `"Transfer 1.5 USDC to Alice"`, or `null` when the
     * instruction has none or when one of its placeholders cannot be presented with confidence,
     * e.g. an amount whose decimals cannot be resolved. Renderers then fall back to `fields`.
     */
    readonly interpolatedIntent: string | null;
};

/**
 * The accounts an instruction display reads, keyed by address, e.g. a mint for its `decimals`.
 * Only accounts that exist are stored, so a missing address means its data is not available.
 */
export type DisplayAccountMap = ReadonlyMap<Address, EncodedAccount>;

/**
 * Names of addresses, e.g. `.sol` domains, token symbols or address book entries, from sources
 * the caller trusts, keyed by address. Use them through the `formatAddress` option.
 */
export type DisplayNamedMap = ReadonlyMap<Address, string>;

/**
 * Everything an instruction display needs beyond the IDL and the instruction: the accounts it
 * reads and names of addresses. It can be serialised, e.g. to display instructions offline on a
 * hardware wallet, using `getDisplayDictionaryCodec`.
 */
export type DisplayDictionary = {
    /** The accounts the display reads, keyed by address. */
    readonly accounts: DisplayAccountMap;
    /** Names of addresses, keyed by address. */
    readonly names: DisplayNamedMap;
};

/**
 * Fetch the accounts at the given addresses, in the same order, which may not exist, e.g. using
 * Kit's `fetchEncodedAccounts` to make a single `getMultipleAccounts` RPC call.
 */
export type FetchMaybeAccountsFn = (addresses: Address[]) => Promise<MaybeEncodedAccount[]>;

/**
 * Options of the instruction display: the options of `formatDecodedNode` from
 * `@codama/dynamic-codecs`, e.g. `formatAddress` to name addresses, `numberFormat` for a locale
 * or `linkables` to avoid recording them again, except `resolveInjectedValue`, which the display
 * handles itself.
 */
export type GetInstructionDisplayOptions = Omit<FormatDecodedNodeOptions, 'resolveInjectedValue'> & {
    /**
     * The accounts the display reads, e.g. from `getDisplayAccountMap`. Values read from other
     * accounts cannot be presented. Defaults to none.
     */
    readonly accounts?: DisplayAccountMap;
};
