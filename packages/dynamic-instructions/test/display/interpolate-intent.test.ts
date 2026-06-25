import type { Address } from '@solana/addresses';
import {
    amountNumberDisplayNode,
    injectedValueNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionDisplayNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { interpolateIntent } from '../../src/display/interpolate-intent';
import { displayContext } from '../test-utils';

const DESTINATION = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY' as Address;

describe('interpolateIntent', () => {
    test('it interpolates data and account placeholders into the sentence', async () => {
        // Given an instruction with an interpolated intent referencing an amount and an account.
        const instruction = instructionNode({
            accounts: [instructionAccountNode({ isSigner: false, isWritable: true, name: 'destination' })],
            arguments: [
                instructionArgumentNode({
                    name: 'amount',
                    type: numberTypeNode('u64', 'le', {
                        display: amountNumberDisplayNode({ decimals: numberValueNode(9) }),
                    }),
                }),
            ],
            display: instructionDisplayNode({
                intent: 'Transfer',
                interpolatedIntent: 'Transfer ${data.amount} to ${accounts.destination}',
            }),
            name: 'transfer',
        });

        // When we interpolate the intent.
        const result = await interpolateIntent(
            displayContext({
                accountAddresses: new Map([['destination', DESTINATION]]),
                data: { amount: 1_500_000_000n },
                instruction,
            }),
        );

        // Then we expect the rendered sentence.
        expect(result).toBe(`Transfer 1.5 to ${DESTINATION}`);
    });

    test('it returns null when the instruction has no interpolated intent', async () => {
        // Given an instruction without an interpolated intent.
        const instruction = instructionNode({
            accounts: [],
            arguments: [],
            display: instructionDisplayNode({ intent: 'Transfer' }),
            name: 'transfer',
        });

        // When we interpolate the intent.
        const result = await interpolateIntent(displayContext({ instruction }));

        // Then we expect null.
        expect(result).toBeNull();
    });

    test('it returns null when a data placeholder references an unknown argument', async () => {
        // Given an intent referencing an argument that does not exist.
        const instruction = instructionNode({
            accounts: [],
            arguments: [],
            display: instructionDisplayNode({ interpolatedIntent: 'Transfer ${data.amount}' }),
            name: 'transfer',
        });

        // When we interpolate the intent.
        const result = await interpolateIntent(displayContext({ instruction }));

        // Then we expect null so the caller falls back to the list.
        expect(result).toBeNull();
    });

    test('it returns null when an account placeholder references an unknown account', async () => {
        // Given an intent referencing an account with no resolved address.
        const instruction = instructionNode({
            accounts: [instructionAccountNode({ isSigner: false, isWritable: true, name: 'destination' })],
            arguments: [],
            display: instructionDisplayNode({ interpolatedIntent: 'Transfer to ${accounts.destination}' }),
            name: 'transfer',
        });

        // When we interpolate the intent without supplying the account address.
        const result = await interpolateIntent(displayContext({ instruction }));

        // Then we expect null.
        expect(result).toBeNull();
    });

    test('it returns null when a value formatter cannot resolve its inputs', async () => {
        // Given an amount whose injected decimals cannot be resolved.
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    name: 'amount',
                    type: numberTypeNode('u64', 'le', {
                        display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
                    }),
                }),
            ],
            display: instructionDisplayNode({ interpolatedIntent: 'Transfer ${data.amount}' }),
            name: 'transfer',
        });

        // When we interpolate the intent.
        // Then it still resolves: an unresolved amount falls back to its raw value rather than failing.
        const result = await interpolateIntent(displayContext({ data: { amount: 1_000_000n }, instruction }));
        expect(result).toBe('Transfer 1000000');
    });
});
