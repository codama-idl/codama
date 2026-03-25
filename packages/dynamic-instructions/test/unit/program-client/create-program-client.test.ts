import { describe, expect, test } from 'vitest';

import { createProgramClient } from '../../../src';
import { DynamicInstructionsError } from '../../../src/shared/errors';
import type { MplTokenMetadataProgramClient } from '../../programs/generated/mpl-token-metadata-idl-types';
import type { SystemProgramClient } from '../../programs/generated/system-program-idl-types';
import { createTestProgramClient, loadIdl, SvmTestContext } from '../../programs/test-utils';

describe('createProgramClient', () => {
    describe('methods', () => {
        const programClient = createTestProgramClient('system-program-idl.json');

        test('should throw when accessing a non-existent instruction', () => {
            expect(() => programClient.methods.nonExistentMethod).toThrow(DynamicInstructionsError);
            expect(() => programClient.methods.nonExistentMethod).toThrow(
                /Instruction "nonExistentMethod" not found in IDL/,
            );
        });

        test('should list available instructions in error message', () => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                programClient.methods.nonExistentMethod;
                expect.unreachable('should have thrown');
            } catch (error) {
                const message = (error as Error).message;
                expect(message).toContain('Available instructions:');

                const allInstructions = [
                    'createAccount',
                    'assign',
                    'transferSol',
                    'createAccountWithSeed',
                    'advanceNonceAccount',
                    'withdrawNonceAccount',
                    'initializeNonceAccount',
                    'authorizeNonceAccount',
                    'allocate',
                    'allocateWithSeed',
                    'assignWithSeed',
                    'transferSolWithSeed',
                    'upgradeNonceAccount',
                ];

                for (const ix of allInstructions) {
                    expect(message).toContain(ix);
                }
            }
        });

        test('should return a builder for a valid instruction', () => {
            const typedClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
            const builder = typedClient.methods.transferSol({ amount: 1000 });
            expect(builder).toBeDefined();
            expect(typeof builder.accounts).toBe('function');
            expect(typeof builder.instruction).toBe('function');
        });

        test('should support "in" operator for existing instructions', () => {
            expect('transferSol' in programClient.methods).toBe(true);
            expect('nonExistentMethod' in programClient.methods).toBe(false);
        });

        test('should preserve standard object semantics for prototype properties with "in" operator', () => {
            expect('toString' in programClient.methods).toBe(true);
            expect('valueOf' in programClient.methods).toBe(true);
            expect('constructor' in programClient.methods).toBe(true);
            expect('hasOwnProperty' in programClient.methods).toBe(true);
        });

        test('should not throw when accessing standard prototype properties', () => {
            expect(() => programClient.methods.constructor).not.toThrow();
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(() => programClient.methods.hasOwnProperty).not.toThrow();
            expect(programClient.methods.constructor).toBeUndefined();
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(programClient.methods.hasOwnProperty).toBeUndefined();
        });

        test('should not throw when awaited directly', async () => {
            // eslint-disable-next-line @typescript-eslint/await-thenable
            const result = await programClient.methods;
            expect(result).toBeDefined();
        });

        test('should not throw when serialized with JSON.stringify', () => {
            expect(() => JSON.stringify(programClient.methods)).not.toThrow();
        });
    });

    describe('pdas', () => {
        const pdaClient = createTestProgramClient<MplTokenMetadataProgramClient>('mpl-token-metadata-idl.json');

        test('should throw when accessing a non-existent PDA', () => {
            // @ts-expect-error - testing error message for non-existent PDA
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            expect(() => pdaClient.pdas.nonExistentPda).toThrow(DynamicInstructionsError);
            // @ts-expect-error - testing error message for non-existent PDA
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            expect(() => pdaClient.pdas.nonExistentPda).toThrow(/PDA "nonExistentPda" not found in IDL/);
        });

        test('should list available PDAs in error message', () => {
            // @ts-expect-error - testing error message for non-existent PDA
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            expect(() => pdaClient.pdas.nonExistentPda).toThrow(/Available PDAs:/);
        });

        test('should support "in" operator for existing PDAs', () => {
            expect('metadata' in pdaClient.pdas).toBe(true);
            expect('nonExistentPda' in pdaClient.pdas).toBe(false);
        });

        test('should preserve standard object semantics for prototype properties with "in" operator', () => {
            expect('toString' in pdaClient.pdas).toBe(true);
            expect('valueOf' in pdaClient.pdas).toBe(true);
            expect('constructor' in pdaClient.pdas).toBe(true);
            expect('hasOwnProperty' in pdaClient.pdas).toBe(true);
        });

        test('should return undefined pdas for IDL without PDAs', () => {
            const noPdaClient = createTestProgramClient('system-program-idl.json');
            expect(noPdaClient.pdas).toBeUndefined();
        });

        test('should return defined pdas for IDL with PDAs', () => {
            expect(pdaClient.pdas).toBeDefined();
        });

        test('should not throw when accessing standard prototype properties', () => {
            expect(() => pdaClient.pdas.constructor).not.toThrow();
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(() => pdaClient.pdas.hasOwnProperty).not.toThrow();
            expect(pdaClient.pdas.constructor).toBeUndefined();
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(pdaClient.pdas.hasOwnProperty).toBeUndefined();
        });

        test('should not throw when awaited directly', async () => {
            // eslint-disable-next-line @typescript-eslint/await-thenable
            const result = await pdaClient.pdas;
            expect(result).toBeDefined();
        });

        test('should not throw when serialized with JSON.stringify', () => {
            expect(() => JSON.stringify(pdaClient.pdas)).not.toThrow();
        });
    });

    describe('programId override', () => {
        const OVERRIDE_ADDRESS = SvmTestContext.generateAddress();

        test('should reflect the override in programAddress', () => {
            const idl = loadIdl('system-program-idl.json');
            const client = createProgramClient<SystemProgramClient>(idl, { programId: OVERRIDE_ADDRESS });
            expect(client.programAddress).toBe(OVERRIDE_ADDRESS);
        });

        test('should use the overridden program address in built instruction', async () => {
            const idl = loadIdl('system-program-idl.json');
            const client = createProgramClient<SystemProgramClient>(idl, { programId: OVERRIDE_ADDRESS });

            const sourceAndDest = SvmTestContext.generateAddress();
            const ix = await client.methods
                .transferSol({ amount: 1000 })
                .accounts({ destination: sourceAndDest, source: sourceAndDest })
                .instruction();

            expect(ix.programAddress).toBe(OVERRIDE_ADDRESS);
        });
    });
});
