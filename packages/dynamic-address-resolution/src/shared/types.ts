import type { EncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';

import type { AddressInput } from './address';

/**
 * The addresses provided for the accounts of an instruction, keyed by account
 * identifier. Remaining accounts are provided as lists of addresses, e.g.
 * `{ authority, signers: [signerA, signerB] }`.
 */
export type AccountsInput = Partial<Record<string, AddressInput | readonly AddressInput[] | null | undefined>>;

/**
 * The data provided for an instruction, as accepted by the codec of its `data`
 * (see `getNodeValueCodec` in `@codama/dynamic-codecs`), e.g. `{ amount: 42n }`.
 */
export type DataInput = unknown;

/**
 * Fetch the accounts at the given addresses, in the same order, e.g. using Kit's
 * `fetchEncodedAccounts` to make a single `getMultipleAccounts` RPC call. Used to read
 * the data of accounts when resolving an instruction, e.g. the `decimals` of a mint.
 *
 * The accounts must exist, since building an instruction cannot do without their data:
 * assert it, e.g. with Kit's `assertAccountsExist`, which throws a descriptive error.
 *
 * @example
 * ```ts
 * const fetchAccounts: FetchAccountsFn = async addresses => {
 *     const accounts = await fetchEncodedAccounts(rpc, addresses);
 *     assertAccountsExist(accounts);
 *     return accounts;
 * };
 * ```
 */
export type FetchAccountsFn = (addresses: Address[]) => Promise<EncodedAccount[]>;
