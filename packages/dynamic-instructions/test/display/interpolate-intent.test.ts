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
    stringValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { interpolateIntent } from '../../src/display/interpolate-intent';
import { displayContext, parsedInstruction } from '../test-utils';

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
                parsedInstruction: parsedInstruction({
                    accounts: [['destination', DESTINATION]],
                    data: { amount: 1_500_000_000n },
                    instruction,
                }),
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
        const result = await interpolateIntent(
            displayContext({ parsedInstruction: parsedInstruction({ instruction }) }),
        );

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
        const result = await interpolateIntent(
            displayContext({ parsedInstruction: parsedInstruction({ instruction }) }),
        );

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
        const result = await interpolateIntent(
            displayContext({ parsedInstruction: parsedInstruction({ instruction }) }),
        );

        // Then we expect null.
        expect(result).toBeNull();
    });

    test('it returns null when a referenced amount scale cannot be resolved', async () => {
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
        // Then we expect null: an unscaled integer in prose reads exactly like a scaled amount, so
        // the sentence is suppressed in favour of the field list, which marks the value as raw.
        const result = await interpolateIntent(
            displayContext({ parsedInstruction: parsedInstruction({ data: { amount: 1_000_000n }, instruction }) }),
        );
        expect(result).toBeNull();
    });

    test('it keeps the sentence when a referenced amount has no decimals attribute', async () => {
        // Given an amount display authored with a unit and no decimals (a valid unscaled amount).
        const instruction = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    name: 'amount',
                    type: numberTypeNode('u64', 'le', {
                        display: amountNumberDisplayNode({ unit: stringValueNode('base units') }),
                    }),
                }),
            ],
            display: instructionDisplayNode({ interpolatedIntent: 'Transfer ${data.amount}' }),
            name: 'transfer',
        });

        // When we interpolate the intent.
        const result = await interpolateIntent(
            displayContext({ parsedInstruction: parsedInstruction({ data: { amount: 1_500_000n }, instruction }) }),
        );

        // Then we expect the sentence with the authored unscaled rendering.
        expect(result).toBe('Transfer 1500000 base units');
    });
});
