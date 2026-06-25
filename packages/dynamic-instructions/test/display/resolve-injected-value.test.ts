import type { Account } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import {
    accountFieldValueNode,
    accountValueNode,
    injectedValueNode,
    numberValueNode,
    type ProvidedNode,
    providedNode,
    stringValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { resolveInjectedValue } from '../../src/display/resolve-injected-value';
import type { DisplayResolutionContext, FetchAccountDataFn } from '../../src/display/types';

const MINT = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY' as Address;

function context(overrides: Partial<DisplayResolutionContext> = {}): DisplayResolutionContext {
    return {
        accountAddresses: new Map<string, Address>(),
        provides: new Map<string, ProvidedNode>(),
        ...overrides,
    };
}

function providesMap(...entries: ProvidedNode[]): ReadonlyMap<string, ProvidedNode> {
    return new Map(entries.map(entry => [entry.name, entry]));
}

/** Builds a decoded Kit `Account` carrying the given data, filling the on-chain metadata. */
function decodedAccount(data: object): Account<object> {
    return {
        address: MINT,
        data,
        executable: false,
        lamports: 0n as Account<object>['lamports'],
        programAddress: MINT,
        space: 0n,
    };
}

describe('resolveInjectedValue', () => {
    test('it resolves a literal number value node', async () => {
        // Given a literal number value node.
        const node = numberValueNode(6);

        // When we resolve it.
        const result = await resolveInjectedValue(node, context());

        // Then we expect the number.
        expect(result).toBe(6);
    });

    test('it resolves a literal string value node', async () => {
        // Given a literal string value node.
        const node = stringValueNode('USDC');

        // When we resolve it.
        const result = await resolveInjectedValue(node, context());

        // Then we expect the string.
        expect(result).toBe('USDC');
    });

    test('it resolves an injected value from a matching provider', async () => {
        // Given an injected value whose key is provided as a literal.
        const node = injectedValueNode({ key: 'decimals' });
        const provides = providesMap(providedNode('decimals', numberValueNode(9)));

        // When we resolve it.
        const result = await resolveInjectedValue(node, context({ provides }));

        // Then we expect the provided value.
        expect(result).toBe(9);
    });

    test('it falls back to the injection fallback when no provider supplies the key', async () => {
        // Given an injected value with a fallback and no provider.
        const node = injectedValueNode({ fallback: numberValueNode(0), key: 'decimals' });

        // When we resolve it.
        const result = await resolveInjectedValue(node, context());

        // Then we expect the fallback value.
        expect(result).toBe(0);
    });

    test('it returns null when an injected value has neither provider nor fallback', async () => {
        // Given an injected value with no provider and no fallback.
        const node = injectedValueNode({ key: 'decimals' });

        // When we resolve it.
        const result = await resolveInjectedValue(node, context());

        // Then we expect null.
        expect(result).toBeNull();
    });

    test('it resolves an account value node to the account address', async () => {
        // Given an account value node and a known account address.
        const node = accountValueNode('mint');
        const accountAddresses = new Map<string, Address>([['mint', MINT]]);

        // When we resolve it.
        const result = await resolveInjectedValue(node, context({ accountAddresses }));

        // Then we expect the address.
        expect(result).toBe(MINT);
    });

    test('it resolves an account field value node via fetchAccountData', async () => {
        // Given an account field value node and account data containing the field.
        const node = accountFieldValueNode({ account: 'mint', path: 'decimals' });
        const accountAddresses = new Map<string, Address>([['mint', MINT]]);
        const fetchAccountData: FetchAccountDataFn = () => Promise.resolve(decodedAccount({ decimals: 6 }));

        // When we resolve it.
        const result = await resolveInjectedValue(node, context({ accountAddresses, fetchAccountData }));

        // Then we expect the field value.
        expect(result).toBe(6);
    });

    test('it returns null for an account field value node with no path (whole struct is not a scalar)', async () => {
        // Given an account field value node without a path.
        const node = accountFieldValueNode({ account: 'mint' });
        const accountAddresses = new Map<string, Address>([['mint', MINT]]);
        const fetchAccountData: FetchAccountDataFn = () => Promise.resolve(decodedAccount({ decimals: 6 }));

        // When we resolve it.
        const result = await resolveInjectedValue(node, context({ accountAddresses, fetchAccountData }));

        // Then we expect null since the whole decoded struct is not a single displayable value.
        expect(result).toBeNull();
    });

    test('it returns null for an account field value node when no fetchAccountData is provided', async () => {
        // Given an account field value node but no fetch hook.
        const node = accountFieldValueNode({ account: 'mint', path: 'decimals' });
        const accountAddresses = new Map<string, Address>([['mint', MINT]]);

        // When we resolve it.
        const result = await resolveInjectedValue(node, context({ accountAddresses }));

        // Then we expect null.
        expect(result).toBeNull();
    });

    test('it returns null for an account field value node when the account is unknown', async () => {
        // Given an account field value node referencing an account with no known address.
        const node = accountFieldValueNode({ account: 'mint', path: 'decimals' });
        const fetchAccountData: FetchAccountDataFn = () => Promise.resolve(decodedAccount({ decimals: 6 }));

        // When we resolve it.
        const result = await resolveInjectedValue(node, context({ fetchAccountData }));

        // Then we expect null.
        expect(result).toBeNull();
    });

    test('it resolves an injected value indirectly through an account field provider', async () => {
        // Given an injected key provided by an account field value node.
        const node = injectedValueNode({ key: 'decimals' });
        const accountAddresses = new Map<string, Address>([['mint', MINT]]);
        const provides = providesMap(
            providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' })),
        );
        const fetchAccountData: FetchAccountDataFn = () => Promise.resolve(decodedAccount({ decimals: 8 }));

        // When we resolve it.
        const result = await resolveInjectedValue(node, context({ accountAddresses, fetchAccountData, provides }));

        // Then we expect the account field value.
        expect(result).toBe(8);
    });
});
