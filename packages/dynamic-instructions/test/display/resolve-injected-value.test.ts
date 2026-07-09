import type { Address } from '@solana/addresses';
import {
    accountFieldValueNode,
    accountNode,
    accountValueNode,
    argumentValueNode,
    injectedValueNode,
    numberTypeNode,
    numberValueNode,
    type ProvidedNode,
    providedNode,
    stringValueNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { resolveInjectedValue } from '../../src/display/resolve-injected-value';
import type { DisplayResolutionContext } from '../../src/display/types';
import { accountFixture, parsedInstruction } from '../test-utils';

const MINT = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY' as Address;

/** A `mint` account whose data is a single `decimals: u8` field. */
const MINT_ACCOUNT = accountNode({
    data: structTypeNode([structFieldTypeNode({ name: 'decimals', type: numberTypeNode('u8') })]),
    name: 'mint',
});

function context(overrides: Partial<DisplayResolutionContext> = {}): DisplayResolutionContext {
    return {
        parsedInstruction: parsedInstruction(),
        provides: new Map<string, ProvidedNode>(),
        resolveAccountData: () => null,
        ...overrides,
    };
}

function providesMap(...entries: ProvidedNode[]): ReadonlyMap<string, ProvidedNode> {
    return new Map(entries.map(entry => [entry.name, entry]));
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

    test('it resolves an argument value node to the decoded argument', async () => {
        // Given an argument value node and a decoded argument in context data.
        const node = argumentValueNode('decimals');

        // When we resolve it.
        const result = await resolveInjectedValue(
            node,
            context({ parsedInstruction: parsedInstruction({ data: { decimals: 6 } }) }),
        );

        // Then we expect the argument value.
        expect(result).toBe(6);
    });

    test('it resolves an injected value provided by an argument value node', async () => {
        // Given an injected key provided by an argument value node.
        const node = injectedValueNode({ key: 'decimals' });
        const provides = providesMap(providedNode('decimals', argumentValueNode('decimals')));

        // When we resolve it (the decoded argument is present in context data).
        const result = await resolveInjectedValue(
            node,
            context({ parsedInstruction: parsedInstruction({ data: { decimals: 6 } }), provides }),
        );

        // Then we expect the argument value.
        expect(result).toBe(6);
    });

    test('it resolves an account value node to the account address', async () => {
        // Given an account value node and a known account address.
        const node = accountValueNode('mint');

        // When we resolve it.
        const result = await resolveInjectedValue(
            node,
            context({ parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]] }) }),
        );

        // Then we expect the address.
        expect(result).toBe(MINT);
    });

    test('it resolves an account field value node by decoding fetched bytes via its accountLink', async () => {
        // Given a `mint` account whose bytes decode (via its codec) to `{ decimals: 6 }`.
        const node = accountFieldValueNode({ account: 'mint', path: 'decimals' });
        const { encoded, resolveAccountData } = accountFixture(MINT_ACCOUNT, { decimals: 6 });

        // When we resolve it, fetching raw bytes and decoding them ourselves.
        const result = await resolveInjectedValue(
            node,
            context({
                fetchAccount: () => Promise.resolve(encoded),
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]] }),
                resolveAccountData,
            }),
        );

        // Then we expect the decoded field value.
        expect(result).toBe(6);
    });

    test('it returns null for an account field value node with no path (whole struct is not a scalar)', async () => {
        // Given an account field value node without a path.
        const node = accountFieldValueNode({ account: 'mint' });
        const { encoded, resolveAccountData } = accountFixture(MINT_ACCOUNT, { decimals: 6 });

        // When we resolve it.
        const result = await resolveInjectedValue(
            node,
            context({
                fetchAccount: () => Promise.resolve(encoded),
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]] }),
                resolveAccountData,
            }),
        );

        // Then we expect null since the whole decoded struct is not a single displayable value.
        expect(result).toBeNull();
    });

    test('it returns null for an account field value node when no fetchAccount is provided', async () => {
        // Given an account field value node but no fetch hook.
        const node = accountFieldValueNode({ account: 'mint', path: 'decimals' });

        // When we resolve it.
        const result = await resolveInjectedValue(
            node,
            context({ parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]] }) }),
        );

        // Then we expect null.
        expect(result).toBeNull();
    });

    test('it returns null for an account field value node when the account is unknown', async () => {
        // Given an account field value node referencing an account with no known address.
        const node = accountFieldValueNode({ account: 'mint', path: 'decimals' });
        const { encoded, resolveAccountData } = accountFixture(MINT_ACCOUNT, { decimals: 6 });

        // When we resolve it.
        const result = await resolveInjectedValue(
            node,
            context({ fetchAccount: () => Promise.resolve(encoded), resolveAccountData }),
        );

        // Then we expect null.
        expect(result).toBeNull();
    });

    test('it returns null for an account field value node when the fetched account does not exist', async () => {
        // Given a known mint address whose account is reported as non-existent on-chain.
        const node = accountFieldValueNode({ account: 'mint', path: 'decimals' });
        const { resolveAccountData } = accountFixture(MINT_ACCOUNT, { decimals: 6 });

        // When we resolve it with a fetch hook that returns a non-existent account.
        const result = await resolveInjectedValue(
            node,
            context({
                fetchAccount: () => Promise.resolve({ address: MINT, exists: false }),
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]] }),
                resolveAccountData,
            }),
        );

        // Then we expect null since there are no bytes to decode.
        expect(result).toBeNull();
    });

    test('it returns null for an account field value node when the account carries no link to decode', async () => {
        // Given an account whose bytes cannot be decoded (no accountLink resolver).
        const node = accountFieldValueNode({ account: 'mint', path: 'decimals' });
        const { encoded } = accountFixture(MINT_ACCOUNT, { decimals: 6 });

        // When we resolve it with a resolveAccountData that cannot decode the account.
        const result = await resolveInjectedValue(
            node,
            context({
                fetchAccount: () => Promise.resolve(encoded),
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]] }),
                resolveAccountData: () => null,
            }),
        );

        // Then we expect null.
        expect(result).toBeNull();
    });

    test('it resolves an injected value indirectly through an account field provider', async () => {
        // Given an injected key provided by an account field value node.
        const node = injectedValueNode({ key: 'decimals' });
        const provides = providesMap(
            providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' })),
        );
        const { encoded, resolveAccountData } = accountFixture(MINT_ACCOUNT, { decimals: 8 });

        // When we resolve it.
        const result = await resolveInjectedValue(
            node,
            context({
                fetchAccount: () => Promise.resolve(encoded),
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]] }),
                provides,
                resolveAccountData,
            }),
        );

        // Then we expect the account field value.
        expect(result).toBe(8);
    });
});
