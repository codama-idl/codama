import type { EncodedAccount, MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import {
    accountFieldValueNode,
    accountLinkNode,
    amountNumberDisplayNode,
    injectedValueNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    providedNode,
} from 'codama';
import { describe, expect, test, vi } from 'vitest';

import {
    type DisplayAccountMap,
    type DisplayDictionary,
    type DisplayNamedMap,
    type FetchAccountsFn,
    getDisplayAccountMap,
    getDisplayAccountMapCodec,
    getDisplayAccountMapDecoder,
    getDisplayAccountMapEncoder,
    getDisplayDictionaryCodec,
    getDisplayDictionaryDecoder,
    getDisplayDictionaryEncoder,
    getDisplayNamedMapCodec,
    getDisplayNamedMapDecoder,
    getDisplayNamedMapEncoder,
    getRequiredAccountsForDisplay,
} from '../../src/display/dictionary';
import { encodeAccountData, makeParsedInstruction, makeRoot, mintAccountNode } from '../test-utils';

const MINT = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY' as Address;
const OWNER = '3Wnd5Df69KitZfUoPYZU438eFRNwGHkhLnSAWL65PxJX' as Address;
const PROGRAM = '11111111111111111111111111111111' as Address;

/** The `mint` account of the instruction, linked to the `mint` account node so it carries a layout. */
function mintInstructionAccount() {
    return instructionAccountNode({
        accountLink: accountLinkNode('mint'),
        isSigner: false,
        isWritable: false,
        name: 'mint',
    });
}

/** An `amount` argument injecting `decimals` (and optionally `symbol`) from the surrounding providers. */
function amountArgument() {
    return instructionArgumentNode({
        name: 'amount',
        type: numberTypeNode('u64', 'le', {
            display: amountNumberDisplayNode({
                decimals: injectedValueNode({ key: 'decimals' }),
                unit: injectedValueNode({ key: 'symbol' }),
            }),
        }),
    });
}

describe('getRequiredAccountsForDisplay', () => {
    test('it returns the address of an account whose field is injected into a display', () => {
        // Given `decimals` injected from the mint account's `decimals` field.
        const instruction = instructionNode({
            accounts: [mintInstructionAccount()],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n }, new Map([['mint', MINT]]));

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then the mint address is required.
        expect(addresses).toEqual([MINT]);
    });

    test('it returns an empty list when no display value reads account state', () => {
        // Given an amount that injects a literal-backed provider (no account field).
        const instruction = instructionNode({
            accounts: [],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [providedNode('decimals', numberValueNode(6))],
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n }, new Map([['mint', MINT]]));

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then nothing needs fetching.
        expect(addresses).toEqual([]);
    });

    test('it returns an empty list when the injection has no matching provider', () => {
        // Given an amount injecting `decimals` but no provider supplies it.
        const instruction = instructionNode({
            accounts: [],
            arguments: [amountArgument()],
            name: 'transfer',
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n });

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then nothing needs fetching.
        expect(addresses).toEqual([]);
    });

    test('it follows an injection fallback that resolves to an account field', () => {
        // Given `decimals` has no provider but falls back to injecting `mintDecimals`, itself an
        // account field read. The runtime resolver would fetch the mint through the fallback, so
        // the planner must list it too.
        const instruction = instructionNode({
            accounts: [mintInstructionAccount()],
            arguments: [
                instructionArgumentNode({
                    name: 'amount',
                    type: numberTypeNode('u64', 'le', {
                        display: amountNumberDisplayNode({
                            decimals: injectedValueNode({
                                fallback: injectedValueNode({ key: 'mintDecimals' }),
                                key: 'decimals',
                            }),
                        }),
                    }),
                }),
            ],
            name: 'transfer',
            provides: [providedNode('mintDecimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n }, new Map([['mint', MINT]]));

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then the mint address (reached through the fallback) is required.
        expect(addresses).toEqual([MINT]);
    });

    test('it ignores an injection fallback that reads no account state', () => {
        // Given `decimals` has no provider and falls back to a literal, so nothing is fetched.
        const instruction = instructionNode({
            accounts: [mintInstructionAccount()],
            arguments: [
                instructionArgumentNode({
                    name: 'amount',
                    type: numberTypeNode('u64', 'le', {
                        display: amountNumberDisplayNode({
                            decimals: injectedValueNode({ fallback: numberValueNode(6), key: 'decimals' }),
                        }),
                    }),
                }),
            ],
            name: 'transfer',
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n }, new Map([['mint', MINT]]));

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then nothing needs fetching.
        expect(addresses).toEqual([]);
    });

    test('it prefers a provider over the injection fallback', () => {
        // Given `decimals` has BOTH a provider (a literal) and a fallback that would read an account
        // field. The runtime resolver takes the provider, so no account is fetched.
        const instruction = instructionNode({
            accounts: [mintInstructionAccount()],
            arguments: [
                instructionArgumentNode({
                    name: 'amount',
                    type: numberTypeNode('u64', 'le', {
                        display: amountNumberDisplayNode({
                            decimals: injectedValueNode({
                                fallback: injectedValueNode({ key: 'mintDecimals' }),
                                key: 'decimals',
                            }),
                        }),
                    }),
                }),
            ],
            name: 'transfer',
            provides: [
                providedNode('decimals', numberValueNode(6)),
                providedNode('mintDecimals', accountFieldValueNode({ account: 'mint', path: 'decimals' })),
            ],
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n }, new Map([['mint', MINT]]));

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then the fallback is not consulted and nothing is fetched.
        expect(addresses).toEqual([]);
    });

    test('it terminates on a cyclic provider chain instead of recursing forever', () => {
        // Given `decimals` provided by re-injecting itself: a cycle the `seen` guard must break.
        const instruction = instructionNode({
            accounts: [mintInstructionAccount()],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [providedNode('decimals', injectedValueNode({ key: 'decimals' }))],
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n }, new Map([['mint', MINT]]));

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then the walk terminates and nothing is fetched.
        expect(addresses).toEqual([]);
    });

    test('it follows a provider that chains through another injection to an account field', () => {
        // Given `decimals` provided by re-injecting `mintDecimals`, itself an account field read.
        const instruction = instructionNode({
            accounts: [mintInstructionAccount()],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [
                providedNode('decimals', injectedValueNode({ key: 'mintDecimals' })),
                providedNode('mintDecimals', accountFieldValueNode({ account: 'mint', path: 'decimals' })),
            ],
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n }, new Map([['mint', MINT]]));

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then the mint address (reached through the provider chain) is required.
        expect(addresses).toEqual([MINT]);
    });

    test('it deduplicates when several injections reference the same account', () => {
        // Given both `decimals` and `symbol` injected from the same mint account.
        const instruction = instructionNode({
            accounts: [mintInstructionAccount()],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [
                providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' })),
                providedNode('symbol', accountFieldValueNode({ account: 'mint', path: 'symbol' })),
            ],
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n }, new Map([['mint', MINT]]));

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then the mint appears once.
        expect(addresses).toEqual([MINT]);
    });

    test('it resolves a key once when the same injection appears in several display slots', () => {
        // Given two amounts both injecting the SAME `decimals` key, backed by one account field.
        const amount = (name: string) =>
            instructionArgumentNode({
                name,
                type: numberTypeNode('u64', 'le', {
                    display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
                }),
            });
        const instruction = instructionNode({
            accounts: [mintInstructionAccount()],
            arguments: [amount('inputAmount'), amount('outputAmount')],
            name: 'swap',
            provides: [providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(
            root,
            instruction,
            { inputAmount: 1n, outputAmount: 2n },
            new Map([['mint', MINT]]),
        );

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then the duplicated key collapses to a single required address.
        expect(addresses).toEqual([MINT]);
    });

    test('it omits an injected account with no concrete address in the instruction', () => {
        // Given an account field injected and a `mint` account on the instruction, but the parsed
        // instruction binds no concrete address for it (e.g. an optional account left unset).
        const instruction = instructionNode({
            accounts: [mintInstructionAccount()],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n });

        // When we compute the required accounts.
        const addresses = getRequiredAccountsForDisplay(root, parsed);

        // Then there is nothing to fetch.
        expect(addresses).toEqual([]);
    });
});

/** A transfer whose amount injects the mint's `decimals`, so the mint must be fetched. */
function transferInjectingMintDecimals() {
    return instructionNode({
        accounts: [mintInstructionAccount()],
        arguments: [
            instructionArgumentNode({
                name: 'amount',
                type: numberTypeNode('u64', 'le', {
                    display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
                }),
            }),
        ],
        name: 'transfer',
        provides: [providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
    });
}

describe('getDisplayAccountMap', () => {
    test('it batch-fetches the required accounts and maps them by address', async () => {
        // Given a transfer needing the mint account, and a mint fetchable through fetchAccounts.
        const instruction = transferInjectingMintDecimals();
        const mint = mintAccountNode();
        const root = makeRoot([instruction], 'testProgram', [mint]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n }, new Map([['mint', MINT]]));
        const encoded = { ...encodeAccountData(root, mint, { decimals: 6 }), address: MINT };

        const fetchAccounts = vi.fn<FetchAccountsFn>(addresses =>
            Promise.resolve(addresses.map(address => ({ ...encoded, address }))),
        );

        // When we fill the account map.
        const map = await getDisplayAccountMap(root, parsed, fetchAccounts);

        // Then fetchAccounts was called exactly once with the deduped address list.
        expect(fetchAccounts).toHaveBeenCalledOnce();
        expect(fetchAccounts).toHaveBeenCalledWith([MINT]);

        // And the map keys the fetched account by its address.
        expect(map.get(MINT)).toEqual(encoded);
    });

    test('it returns an empty map without fetching when no account is required', async () => {
        // Given an instruction whose display reads no account state.
        const instruction = instructionNode({
            accounts: [],
            arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') })],
            name: 'transfer',
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n });
        const fetchAccounts = vi.fn<FetchAccountsFn>(() => Promise.resolve([]));

        // When we fill the account map.
        const map = await getDisplayAccountMap(root, parsed, fetchAccounts);

        // Then no fetch happens and the map is empty.
        expect(fetchAccounts).not.toHaveBeenCalled();
        expect(map.size).toBe(0);
    });

    test('it omits a non-existent account from the map', async () => {
        // Given the mint required, but the RPC reports it does not exist.
        const instruction = transferInjectingMintDecimals();
        const mint = mintAccountNode();
        const root = makeRoot([instruction], 'testProgram', [mint]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 1n }, new Map([['mint', MINT]]));
        const fetchAccounts: FetchAccountsFn = addresses =>
            Promise.resolve(addresses.map(address => ({ address, exists: false }) as MaybeEncodedAccount));

        // When we fill the account map.
        const map = await getDisplayAccountMap(root, parsed, fetchAccounts);

        // Then the map has no entry: a missing key is all "no data" needs to convey.
        expect(map.has(MINT)).toBe(false);
    });
});

/** An account carrying the given bytes and simple metadata. */
function makeEncodedAccount(address: Address, data: Uint8Array): EncodedAccount {
    return {
        address,
        data,
        executable: false,
        lamports: 42n as EncodedAccount['lamports'],
        programAddress: PROGRAM,
        space: BigInt(data.length),
    };
}

describe('getDisplayAccountMapCodec', () => {
    test('it round-trips an account map, preserving bytes and metadata', () => {
        // Given a map with two accounts, one carrying multi-byte data.
        const map: DisplayAccountMap = new Map([
            [MINT, makeEncodedAccount(MINT, new Uint8Array([6, 255, 0, 128]))],
            [OWNER, makeEncodedAccount(OWNER, new Uint8Array([]))],
        ]);

        // When we encode then decode it.
        const codec = getDisplayAccountMapCodec();
        const decoded = codec.decode(codec.encode(map));

        // Then it reproduces both entries faithfully.
        expect(decoded.get(MINT)).toEqual(map.get(MINT));
        expect(decoded.get(OWNER)).toEqual(map.get(OWNER));
    });

    test('it round-trips an empty account map', () => {
        const codec = getDisplayAccountMapCodec();
        const decoded = codec.decode(codec.encode(new Map()));
        expect(decoded.size).toBe(0);
    });

    test('its standalone encoder and decoder interoperate', () => {
        // Given the split encoder/decoder rather than the combined codec.
        const map: DisplayAccountMap = new Map([[MINT, makeEncodedAccount(MINT, new Uint8Array([1, 2, 3]))]]);

        // When we encode with the encoder and decode with the decoder.
        const decoded = getDisplayAccountMapDecoder().decode(getDisplayAccountMapEncoder().encode(map));

        // Then the split halves agree with the combined codec.
        expect(decoded.get(MINT)).toEqual(map.get(MINT));
    });
});

describe('getDisplayNamedMapCodec', () => {
    test('it round-trips names including multi-byte UTF-8', () => {
        // Given a domain name and a multi-byte token symbol.
        const map: DisplayNamedMap = new Map([
            [OWNER, 'toly.sol'],
            [MINT, 'USD₮'],
        ]);

        // When we encode then decode it.
        const codec = getDisplayNamedMapCodec();
        const decoded = codec.decode(codec.encode(map));

        // Then both names survive intact.
        expect(decoded.get(OWNER)).toBe('toly.sol');
        expect(decoded.get(MINT)).toBe('USD₮');
    });

    test('it round-trips an empty named map', () => {
        const codec = getDisplayNamedMapCodec();
        const decoded = codec.decode(codec.encode(new Map()));
        expect(decoded.size).toBe(0);
    });

    test('its standalone encoder and decoder interoperate', () => {
        const map: DisplayNamedMap = new Map([[OWNER, 'toly.sol']]);
        const decoded = getDisplayNamedMapDecoder().decode(getDisplayNamedMapEncoder().encode(map));
        expect(decoded.get(OWNER)).toBe('toly.sol');
    });
});

describe('getDisplayDictionaryCodec', () => {
    test('it round-trips a full dictionary composed of both maps', () => {
        // Given a dictionary carrying an account map and a named map.
        const dictionary: DisplayDictionary = {
            accounts: new Map([[MINT, makeEncodedAccount(MINT, new Uint8Array([6]))]]),
            names: new Map([[OWNER, 'toly.sol']]),
        };

        // When we encode then decode it.
        const codec = getDisplayDictionaryCodec();
        const decoded = codec.decode(codec.encode(dictionary));

        // Then both maps are reproduced.
        expect(decoded.accounts.get(MINT)).toEqual(dictionary.accounts.get(MINT));
        expect(decoded.names.get(OWNER)).toBe('toly.sol');
    });

    test('its standalone encoder and decoder interoperate', () => {
        const dictionary: DisplayDictionary = {
            accounts: new Map([[MINT, makeEncodedAccount(MINT, new Uint8Array([9]))]]),
            names: new Map([[OWNER, 'toly.sol']]),
        };
        const decoded = getDisplayDictionaryDecoder().decode(getDisplayDictionaryEncoder().encode(dictionary));
        expect(decoded.accounts.get(MINT)).toEqual(dictionary.accounts.get(MINT));
        expect(decoded.names.get(OWNER)).toBe('toly.sol');
    });
});
