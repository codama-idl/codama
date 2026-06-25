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
} from 'codama';
import { describe, expect, test } from 'vitest';

import { resolveConsumedMemberNames } from '../../src/display/resolve-consumed-members';
import { displayContextFor, mockFetch } from '../test-utils';

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
        const consumed = await resolveConsumedMemberNames(
            displayContextFor(instruction, {
                accountAddresses: new Map([['mint', MINT]]),
                fetchAccountData: mockFetch([[MINT, { decimals: 6 }]]),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
            }),
        );

        // Then the mint is marked consumed.
        expect(consumed).toEqual(new Set(['mint']));
    });

    test('it does not mark an account consumed when its field cannot resolve', async () => {
        // Given the same injection but no fetchAccountData (offline).
        const instruction = instructionNode({
            accounts: [],
            arguments: [amountArgument()],
            name: 'transfer',
            provides: [providedNode('decimals', accountFieldValueNode({ account: 'mint', path: 'decimals' }))],
        });

        // When we resolve the consumed members without fetching.
        const consumed = await resolveConsumedMemberNames(
            displayContextFor(instruction, {
                accountAddresses: new Map([['mint', MINT]]),
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
            displayContextFor(instruction, {
                accountAddresses: new Map([['mint', MINT]]),
                provides: new Map(instruction.provides?.map(p => [p.name, p]) ?? []),
            }),
        );

        // Then the mint is consumed via the account reference.
        expect(consumed).toEqual(new Set(['mint']));
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
        const consumed = await resolveConsumedMemberNames(displayContextFor(instruction));

        // Then nothing is consumed.
        expect(consumed).toEqual(new Set());
    });
});
