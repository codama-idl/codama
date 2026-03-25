import { address } from '@solana/addresses';
import { describe, expect, test } from 'vitest';

import type { CircularAccountRefsProgramClient } from '../generated/circular-account-refs-idl-types';
import { createTestProgramClient } from '../test-utils';

describe('Circular Account References (Without PDA Seeds)', () => {
    const programClient = createTestProgramClient<CircularAccountRefsProgramClient>('circular-account-refs-idl.json');

    test('should throw AccountError for A->A self-reference', async () => {
        await expect(programClient.methods.selfReference().accounts({}).instruction()).rejects.toThrow(
            /Circular dependency detected: accountA -> accountA/,
        );
    });

    test('should throw AccountError for A->B->A two-node cycle', async () => {
        await expect(programClient.methods.twoAccountCycle().accounts({}).instruction()).rejects.toThrow(
            /Circular dependency detected: account(A|B) -> account(A|B) -> account(A|B)/,
        );
    });

    test('should throw AccountError for A->B->C->A three-node cycle', async () => {
        await expect(programClient.methods.threeAccountCycle().accounts({}).instruction()).rejects.toThrow(
            /Circular dependency detected: account(A|B|C) -> account(A|B|C) -> account(A|B|C) -> account(A|B|C)/,
        );
    });

    test('should succeed when account is provided (A->B->A cycle)', async () => {
        const testAddress = address('HNvDDMNXFUkJz8fFDVJ2GLrWNWYcFfqjJWJZR7JSxaMv');

        const ixWithA = await programClient.methods.twoAccountCycle().accounts({ accountA: testAddress }).instruction();
        const ixWithB = await programClient.methods.twoAccountCycle().accounts({ accountB: testAddress }).instruction();

        [ixWithA, ixWithB].forEach(ix => {
            expect(ix.accounts?.length).toBe(2);
            ix.accounts?.forEach(account => {
                expect(account.address).toBe(testAddress);
            });
        });
    });

    test('should succeed when account in three-node cycle (A->B->C->A) is provided', async () => {
        const testAddress = address('HNvDDMNXFUkJz8fFDVJ2GLrWNWYcFfqjJWJZR7JSxaMv');

        const ixWithA = await programClient.methods
            .threeAccountCycle()
            .accounts({ accountA: testAddress })
            .instruction();

        const ixWithB = await programClient.methods
            .threeAccountCycle()
            .accounts({ accountB: testAddress })
            .instruction();

        const ixWithC = await programClient.methods
            .threeAccountCycle()
            .accounts({ accountC: testAddress })
            .instruction();

        [ixWithA, ixWithB, ixWithC].forEach(ix => {
            expect(ix.accounts?.length).toBe(3);
            ix.accounts?.forEach(account => {
                expect(account.address).toBe(testAddress);
            });
        });
    });

    test('should provide account self-reference', async () => {
        const testAddress = address('HNvDDMNXFUkJz8fFDVJ2GLrWNWYcFfqjJWJZR7JSxaMv');
        const ix = await programClient.methods.selfReference().accounts({ accountA: testAddress }).instruction();

        expect(ix.accounts?.length).toBe(1);
        expect(ix?.accounts?.[0]?.address).toBe(testAddress);
    });
});
