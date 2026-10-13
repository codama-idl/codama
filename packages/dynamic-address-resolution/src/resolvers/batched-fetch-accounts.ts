import { CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT, CodamaError } from '@codama/errors';
import type { EncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';

import type { FetchAccountsFn } from '../shared/types';

const batchedFetchAccounts = new WeakSet<FetchAccountsFn>();

/**
 * Wrap a {@link FetchAccountsFn} so that each account is fetched once, in as few calls as
 * possible. The addresses requested until the next macrotask, e.g. by PDA seeds resolved in
 * parallel, are fetched in a single call, and every account is cached by address.
 *
 * Use one per instruction, or per group of instructions built together, since cached accounts
 * are never refreshed. Wrapping a function this returned gives it back as is, so callers can
 * share a batch and a cache with the functions they call.
 *
 * Errors thrown by the wrapped function, synchronously or not, reject every request of its
 * batch. Fetched accounts are matched by address, in any order, and a requested address with
 * no fetched account rejects with a `DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT` error.
 *
 * @example
 * ```ts
 * const fetchAccounts = getBatchedFetchAccounts(addresses => fetchEncodedAccounts(rpc, addresses));
 * const [mint, owner] = await Promise.all([fetchAccounts([mintAddress]), fetchAccounts([ownerAddress])]);
 * // A single `getMultipleAccounts` call fetched both accounts.
 * ```
 */
export function getBatchedFetchAccounts(fetchAccounts: FetchAccountsFn): FetchAccountsFn {
    if (batchedFetchAccounts.has(fetchAccounts)) return fetchAccounts;

    const cache = new Map<Address, Promise<EncodedAccount>>();
    let batch: { accounts: Promise<EncodedAccount[]>; addresses: Address[] } | undefined;

    const fetchBatch = async (addresses: Address[]): Promise<EncodedAccount[]> => {
        // Waiting for a macrotask lets every pending resolution request its accounts first.
        await new Promise(resolve => setTimeout(resolve, 0));
        batch = undefined; // Later requests open a new batch.
        return await fetchAccounts(addresses);
    };

    const fetchAccount = (address: Address): Promise<EncodedAccount> => {
        const cached = cache.get(address);
        if (cached) return cached;
        if (!batch) {
            const addresses: Address[] = [];
            batch = { accounts: fetchBatch(addresses), addresses };
        }
        batch.addresses.push(address);
        const account = batch.accounts.then(accounts => findAccount(accounts, address));
        cache.set(address, account);
        return account;
    };

    const batched: FetchAccountsFn = addresses => Promise.all(addresses.map(fetchAccount));
    batchedFetchAccounts.add(batched);
    return batched;
}

/**
 * The fetched account at the given address. Looking it up by address makes the order of the
 * fetched accounts irrelevant.
 */
function findAccount(accounts: EncodedAccount[], address: Address): EncodedAccount {
    const account = accounts.find(account => account.address === address);
    if (!account) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT, {
            message: `fetchAccounts returned no account for address ${address}`,
        });
    }
    return account;
}
