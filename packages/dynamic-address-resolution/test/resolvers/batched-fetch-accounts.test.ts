import { CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT, CodamaError } from '@codama/errors';
import type { EncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import { describe, expect, test, vi } from 'vitest';

import { type FetchAccountsFn, getBatchedFetchAccounts } from '../../src';

const A = '11111111111111111111111111111111' as Address;
const B = 'SysvarRent111111111111111111111111111111111' as Address;

/** An empty account at the given address. */
function emptyAccount(address: Address): EncodedAccount {
    return {
        address,
        data: new Uint8Array(),
        executable: false,
        lamports: 0n as EncodedAccount['lamports'],
        programAddress: A,
        space: 0n,
    };
}

/** A `fetchAccounts` function returning empty accounts. */
function getFetchAccounts() {
    return vi.fn<FetchAccountsFn>(addresses => Promise.resolve(addresses.map(emptyAccount)));
}

describe('getBatchedFetchAccounts', () => {
    test('it returns the fetched accounts in order', async () => {
        const fetchAccounts = getBatchedFetchAccounts(getFetchAccounts());
        expect(await fetchAccounts([B, A])).toEqual([emptyAccount(B), emptyAccount(A)]);
    });

    test('it fetches the accounts requested together in a single call', async () => {
        const fetchAccounts = getFetchAccounts();
        const batched = getBatchedFetchAccounts(fetchAccounts);
        await Promise.all([batched([A]), Promise.resolve().then(() => batched([B]))]);
        expect(fetchAccounts.mock.calls).toEqual([[[A, B]]]);
    });

    test('it waits for pending promise reactions before fetching the batch', async () => {
        // Given an account requested after a chain of promise reactions, e.g. resolving other values first.
        const fetchAccounts = getFetchAccounts();
        const batched = getBatchedFetchAccounts(fetchAccounts);
        const requestLater = async () => {
            for (let i = 0; i < 10; i++) await Promise.resolve();
            return await batched([B]);
        };

        // Then it is fetched together with the first account.
        await Promise.all([batched([A]), requestLater()]);
        expect(fetchAccounts.mock.calls).toEqual([[[A, B]]]);
    });

    test('it fetches each account once', async () => {
        const fetchAccounts = getFetchAccounts();
        const batched = getBatchedFetchAccounts(fetchAccounts);
        await Promise.all([batched([A]), batched([A, B])]);
        await batched([B]);
        expect(fetchAccounts.mock.calls).toEqual([[[A, B]]]);
    });

    test('it fetches accounts requested after a batch was sent in another call', async () => {
        const fetchAccounts = getFetchAccounts();
        const batched = getBatchedFetchAccounts(fetchAccounts);
        await batched([A]);
        await batched([B]);
        expect(fetchAccounts.mock.calls).toEqual([[[A]], [[B]]]);
    });

    test('it returns functions it wrapped as is', () => {
        const batched = getBatchedFetchAccounts(getFetchAccounts());
        expect(getBatchedFetchAccounts(batched)).toBe(batched);
    });

    test('it rejects every request of a batch whose fetch fails', async () => {
        const error = new Error('RPC error');
        const batched = getBatchedFetchAccounts(() => Promise.reject(error));
        const results = await Promise.allSettled([batched([A]), batched([B])]);
        expect(results).toEqual([
            { reason: error, status: 'rejected' },
            { reason: error, status: 'rejected' },
        ]);
    });

    test('it rejects every request of a batch whose fetch throws synchronously', async () => {
        const error = new Error('Invalid input');
        const batched = getBatchedFetchAccounts(() => {
            throw error;
        });
        const results = await Promise.allSettled([batched([A]), batched([B])]);
        expect(results).toEqual([
            { reason: error, status: 'rejected' },
            { reason: error, status: 'rejected' },
        ]);
    });

    test('it matches fetched accounts by address, in any order', async () => {
        const batched = getBatchedFetchAccounts(() => Promise.resolve([emptyAccount(B), emptyAccount(A)]));
        expect(await batched([A, B])).toEqual([emptyAccount(A), emptyAccount(B)]);
    });

    test('it rejects addresses without a fetched account', async () => {
        const batched = getBatchedFetchAccounts(() => Promise.resolve([emptyAccount(B)]));
        await expect(batched([A])).rejects.toThrow(
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_VALIDATE_INPUT, {
                message: `fetchAccounts returned no account for address ${A}`,
            }),
        );
    });
});
