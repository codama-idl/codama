import type { Address } from '@solana/addresses';
import {
    accountFieldValueNode,
    accountValueNode,
    amountNumberDisplayNode,
    injectedValueNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    providedNode,
    stringValueNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test, vi } from 'vitest';

import { resolveConsumedMemberNames } from '../../src/display/resolve-consumed-members';
import { accountFixture, displayContext, mintAccountNode, mockFetch, parsedInstruction } from '../test-utils';

const MINT = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY' as Address;

/** An `amount` argument that injects `decimals` and `symbol` from the surrounding providers. */
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

describe('resolveConsumedMemberNames', () => {
    test('it marks an account consumed when its field is injected and resolves', async () => {
        // Given `decimals` injected from the mint account's field, with the mint fetchable.
        const instruction = instructionNode({
            accounts: [],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
        });

        // When we resolve the consumed members.
        const mint = accountFixture(mintAccountNode(), { decimals: 6 });
        const consumed = await resolveConsumedMemberNames(
            displayContext({
                fetchAccount: mockFetch([[MINT, mint.encoded]]),
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]], instruction }),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
                resolveAccountData: mint.resolveAccountData,
            }),
        );

        // Then the mint is marked consumed.
        expect(consumed).toEqual(new Set(['mint']));
    });

    test('it does not mark an account consumed when its field cannot resolve', async () => {
        // Given the same injection but no fetchAccount (offline).
        const instruction = instructionNode({
            accounts: [],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
        });

        // When we resolve the consumed members without fetching.
        const consumed = await resolveConsumedMemberNames(
            displayContext({
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]], instruction }),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
            }),
        );

        // Then nothing is consumed because the field could not be read.
        expect(consumed).toEqual(new Set());
    });

    test('it marks an account consumed through an accountValueNode provider', async () => {
        // Given `symbol` injected by referencing the mint account directly.
        const instruction = instructionNode({
            accounts: [],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [
                providedNode('decimals', stringValueNode('6')),
                providedNode('symbol', accountValueNode('mint')),
            ],
        });

        // When we resolve the consumed members.
        const consumed = await resolveConsumedMemberNames(
            displayContext({
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]], instruction }),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
            }),
        );

        // Then the mint is consumed via the account reference.
        expect(consumed).toEqual(new Set(['mint']));
    });

    test('it marks an account consumed by an amount nested in a flattened struct field', async () => {
        // Given an `amount` (injecting `decimals`) nested inside a flattened struct argument.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    display: structFieldDisplayNode({ flatten: true }),
                    name: 'order',
                    type: structTypeNode([
                        structFieldTypeNode({
                            name: 'amount',
                            type: numberTypeNode('u64', 'le', {
                                display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
                            }),
                        }),
                    ]),
                }),
            ],
            name: 'transfer',
            provides: [providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
        });

        // When we resolve the consumed members.
        const mint = accountFixture(mintAccountNode(), { decimals: 6 });
        const consumed = await resolveConsumedMemberNames(
            displayContext({
                fetchAccount: mockFetch([[MINT, mint.encoded]]),
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]], instruction }),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
                resolveAccountData: mint.resolveAccountData,
            }),
        );

        // Then the mint is consumed even though the injecting amount is nested in a struct.
        expect(consumed).toEqual(new Set(['mint']));
    });

    test('it does not mark an account consumed by an amount nested in a non-flattened struct', async () => {
        // Given the same nested amount, but in a struct the argument does NOT flatten — so the
        // struct renders as a single raw value and the nested amount is never surfaced.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    name: 'order',
                    type: structTypeNode([
                        structFieldTypeNode({
                            name: 'amount',
                            type: numberTypeNode('u64', 'le', {
                                display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
                            }),
                        }),
                    ]),
                }),
            ],
            name: 'transfer',
            provides: [providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
        });

        // When we resolve the consumed members, with the mint fully fetchable.
        const mint = accountFixture(mintAccountNode(), { decimals: 6 });
        const consumed = await resolveConsumedMemberNames(
            displayContext({
                fetchAccount: mockFetch([[MINT, mint.encoded]]),
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]], instruction }),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
                resolveAccountData: mint.resolveAccountData,
            }),
        );

        // Then the mint stays visible: its decimals were never displayed, so it is not consumed.
        expect(consumed).toEqual(new Set());
    });

    test('it returns an empty set when no display value injects anything', async () => {
        // Given an amount that uses literal decimals (no injection).
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    name: 'amount',
                    type: numberTypeNode('u64', 'le', {
                        display: amountNumberDisplayNode({ decimals: numberValueNode(6) }),
                    }),
                }),
            ],
            name: 'transfer',
        });

        // When we resolve the consumed members.
        const consumed = await resolveConsumedMemberNames(
            displayContext({ parsedInstruction: parsedInstruction({ instruction }) }),
        );

        // Then nothing is consumed.
        expect(consumed).toEqual(new Set());
    });

    test('it marks an account consumed through an injection fallback', async () => {
        // Given `decimals` has no provider but falls back to injecting `mintDecimals`, itself the
        // mint's account field. The value resolves through the fallback, so the mint is consumed.
        const instruction = instructionNode({
            accounts: [],
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

        // When we resolve the consumed members with the mint fetchable.
        const mint = accountFixture(mintAccountNode(), { decimals: 6 });
        const consumed = await resolveConsumedMemberNames(
            displayContext({
                fetchAccount: mockFetch([[MINT, mint.encoded]]),
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]], instruction }),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
                resolveAccountData: mint.resolveAccountData,
            }),
        );

        // Then the mint (reached through the fallback) is consumed.
        expect(consumed).toEqual(new Set(['mint']));
    });

    test('it marks an account consumed through a provider chain', async () => {
        // Given `decimals` provided by re-injecting `mintDecimals`, itself the mint's account field.
        const instruction = instructionNode({
            accounts: [],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [
                providedNode('decimals', injectedValueNode({ key: 'mintDecimals' })),
                providedNode('mintDecimals', accountFieldValueNode({ account: 'mint', path: 'decimals' })),
            ],
        });

        // When we resolve the consumed members with the mint fetchable.
        const mint = accountFixture(mintAccountNode(), { decimals: 6 });
        const consumed = await resolveConsumedMemberNames(
            displayContext({
                fetchAccount: mockFetch([[MINT, mint.encoded]]),
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]], instruction }),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
                resolveAccountData: mint.resolveAccountData,
            }),
        );

        // Then the mint (reached through the chain) is consumed.
        expect(consumed).toEqual(new Set(['mint']));
    });

    test('it fetches an account once when the same key is injected into several slots', async () => {
        // Given two amounts both injecting the SAME `decimals` key, backed by one account field.
        const amount = (name: string) =>
            instructionArgumentNode({
                name,
                type: numberTypeNode('u64', 'le', {
                    display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
                }),
            });
        const instruction = instructionNode({
            accounts: [],
            arguments: [amount('inputAmount'), amount('outputAmount')],
            name: 'swap',
            provides: [providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
        });

        // When we resolve the consumed members, counting fetches.
        const mint = accountFixture(mintAccountNode(), { decimals: 6 });
        const fetchAccount = vi.fn(mockFetch([[MINT, mint.encoded]]));
        const consumed = await resolveConsumedMemberNames(
            displayContext({
                fetchAccount,
                parsedInstruction: parsedInstruction({
                    accounts: [['mint', MINT]],
                    data: { inputAmount: 1n, outputAmount: 2n },
                    instruction,
                }),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
                resolveAccountData: mint.resolveAccountData,
            }),
        );

        // Then the mint is consumed and the duplicated injection collapsed to a single fetch.
        expect(consumed).toEqual(new Set(['mint']));
        expect(fetchAccount).toHaveBeenCalledOnce();
    });

    test('it does not mark a fallback-resolved account consumed when it cannot resolve', async () => {
        // Given the same fallback-to-account-field injection but offline (no fetchAccount).
        const instruction = instructionNode({
            accounts: [],
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

        // When we resolve without fetching.
        const consumed = await resolveConsumedMemberNames(
            displayContext({
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]], instruction }),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
            }),
        );

        // Then the mint stays visible: the field could not be read.
        expect(consumed).toEqual(new Set());
    });

    test('it terminates on a cyclic provider chain instead of recursing forever', async () => {
        // Given `decimals` provided by re-injecting itself: a cycle the selection walk must break.
        const instruction = instructionNode({
            accounts: [],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [providedNode('decimals', injectedValueNode({ key: 'decimals' }))],
        });

        // When we resolve the consumed members.
        const consumed = await resolveConsumedMemberNames(
            displayContext({
                parsedInstruction: parsedInstruction({ accounts: [['mint', MINT]], instruction }),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
            }),
        );

        // Then the walk terminates and nothing is consumed.
        expect(consumed).toEqual(new Set());
    });
});
