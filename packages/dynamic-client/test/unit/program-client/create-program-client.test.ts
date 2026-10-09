import {
    CODAMA_ERROR__DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__PDA_NOT_FOUND,
    CODAMA_ERROR__VERSION_MISMATCH,
} from '@codama/errors';
import { address, getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';
import { CODAMA_VERSION } from 'codama';
import { describe, expect, test } from 'vitest';

import { createProgramClient, type ProgramClient } from '../../../src';
import type { MplTokenMetadataProgramClient } from '../../programs/generated/mpl-token-metadata-idl-types';
import type { SystemProgramClient } from '../../programs/generated/system-program-idl-types';
import { createTestProgramClient, loadIdl, SvmTestContext } from '../../programs/test-utils';

describe('createProgramClient', () => {
    describe('methods', () => {
        const programClient = createTestProgramClient('system-program-idl.json');

        test('should throw when accessing a non-existent instruction', () => {
            expect(() => programClient.methods.nonExistentMethod).toThrow(
                expect.objectContaining({
                    context: expect.objectContaining({
                        __code: CODAMA_ERROR__DYNAMIC_CLIENT__INSTRUCTION_NOT_FOUND,
                        availableIxs: [
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
                        ],
                        instructionName: 'nonExistentMethod',
                    }),
                }),
            );
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
            // @ts-expect-error - testing a non-existent PDA
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            expect(() => pdaClient.pdas.nonExistentPda).toThrow(
                expect.objectContaining({
                    context: expect.objectContaining({
                        __code: CODAMA_ERROR__DYNAMIC_CLIENT__PDA_NOT_FOUND,
                        available:
                            'metadata, deprecatedMasterEditionV1, masterEdition, editionMarker, editionMarkerV2, tokenRecord, metadataDelegateRecord, collectionAuthorityRecord, holderDelegateRecord, useAuthorityRecord',
                        pdaName: 'nonExistentPda',
                    }),
                }),
            );
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

    describe('pdas programId option', () => {
        const PROGRAM_ADDRESS = address('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDrdXkTfBR');

        // The `vault` account defaults to an inline PDA derived from the `vaultProgram` account.
        const idl = {
            kind: 'rootNode',
            program: {
                identifier: 'vaultProgram',
                instructions: [
                    {
                        accounts: [
                            {
                                identifier: 'authority',
                                isSigner: true,
                                isWritable: false,
                                kind: 'instructionAccountNode',
                            },
                            {
                                identifier: 'otherProgram',
                                isSigner: false,
                                isWritable: false,
                                kind: 'instructionAccountNode',
                            },
                            {
                                defaultValue: {
                                    kind: 'pdaValueNode',
                                    pda: {
                                        identifier: 'vault',
                                        kind: 'pdaNode',
                                        seeds: [
                                            {
                                                identifier: 'authority',
                                                kind: 'variablePdaSeedNode',
                                                type: { kind: 'publicKeyTypeNode' },
                                            },
                                        ],
                                    },
                                    programId: { identifier: 'otherProgram', kind: 'accountValueNode' },
                                    seeds: [
                                        {
                                            identifier: 'authority',
                                            kind: 'pdaSeedValueNode',
                                            value: { identifier: 'authority', kind: 'accountValueNode' },
                                        },
                                    ],
                                },
                                identifier: 'vault',
                                isSigner: false,
                                isWritable: true,
                                kind: 'instructionAccountNode',
                            },
                        ],
                        identifier: 'open',
                        kind: 'instructionNode',
                    },
                ],
                kind: 'programNode',
                publicKey: PROGRAM_ADDRESS,
                version: '1.0.0',
            },
            standard: 'codama',
            version: CODAMA_VERSION,
        };

        test('should derive PDAs from the given program like instructions do', async () => {
            const client = createProgramClient(idl);
            const [authority, otherProgram] = await Promise.all([
                SvmTestContext.generateAddress(),
                SvmTestContext.generateAddress(),
            ]);

            const ix = await client.methods.open().accounts({ authority, otherProgram }).instruction();
            const [vault] = await client.pdas!.vault({ authority }, { programId: otherProgram });

            expect(ix.accounts?.[2].address).toBe(vault);
            expect(vault).toBe(
                (
                    await getProgramDerivedAddress({
                        programAddress: otherProgram,
                        seeds: [getAddressEncoder().encode(authority)],
                    })
                )[0],
            );
        });

        test('should derive PDAs from the program defining them by default', async () => {
            const client = createProgramClient(idl);
            const authority = await SvmTestContext.generateAddress();

            const [vault] = await client.pdas!.vault({ authority });

            expect(vault).toBe(
                (
                    await getProgramDerivedAddress({
                        programAddress: PROGRAM_ADDRESS,
                        seeds: [getAddressEncoder().encode(authority)],
                    })
                )[0],
            );
        });
    });

    describe('programId override', () => {
        const OVERRIDE_ADDRESS = address('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDrdXkTfBR');

        test('should reflect the override in programAddress', () => {
            const idl = loadIdl('system-program-idl.json');
            const client = createProgramClient<SystemProgramClient>(idl, { programId: OVERRIDE_ADDRESS });
            expect(client.programAddress).toBe(OVERRIDE_ADDRESS);
        });

        test('should use the overridden program address in built instruction', async () => {
            const idl = loadIdl('system-program-idl.json');
            const client = createProgramClient<SystemProgramClient>(idl, { programId: OVERRIDE_ADDRESS });

            const sourceAndDest = await SvmTestContext.generateAddress();
            const ix = await client.methods
                .transferSol({ amount: 1000 })
                .accounts({ destination: sourceAndDest, source: sourceAndDest })
                .instruction();

            expect(ix.programAddress).toBe(OVERRIDE_ADDRESS);
        });
    });

    describe('IDL versions', () => {
        const PROGRAM_ADDRESS = address('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDrdXkTfBR');

        const idl = {
            kind: 'rootNode',
            program: {
                identifier: 'pingProgram',
                instructions: [
                    {
                        accounts: [
                            {
                                identifier: 'payer',
                                isOptional: false,
                                isSigner: true,
                                isWritable: true,
                                kind: 'instructionAccountNode',
                            },
                        ],
                        data: {
                            fields: [
                                {
                                    identifier: 'amount',
                                    kind: 'structFieldTypeNode',
                                    type: { endian: 'le', format: 'u16', kind: 'integerTypeNode' },
                                },
                            ],
                            kind: 'structTypeNode',
                        },
                        identifier: 'ping',
                        kind: 'instructionNode',
                        optionalAccountStrategy: 'programId',
                    },
                ],
                kind: 'programNode',
                publicKey: PROGRAM_ADDRESS,
                version: '1.0.0',
            },
            standard: 'codama',
            version: CODAMA_VERSION,
        };

        async function expectPingInstruction(client: ProgramClient): Promise<void> {
            const payer = await SvmTestContext.generateAddress();
            const ix = await client.methods.ping({ amount: 258 }).accounts({ payer }).instruction();
            expect(ix).toStrictEqual({
                accounts: [{ address: payer, role: AccountRole.WRITABLE_SIGNER }],
                data: new Uint8Array([2, 1]),
                programAddress: PROGRAM_ADDRESS,
            });
        }

        test('should accept an IDL object of the latest major', async () => {
            const client = createProgramClient(idl);
            expect(client.root).toStrictEqual(idl);
            await expectPingInstruction(client);
        });

        test('should accept an IDL JSON string of the latest major', async () => {
            const client = createProgramClient(JSON.stringify(idl));
            expect(client.root).toStrictEqual(idl);
            await expectPingInstruction(client);
        });

        test.each(['1.5.0', '3.0.0'])('should reject IDLs of another major (%s)', version => {
            expect(() => createProgramClient({ ...idl, version })).toThrow(
                expect.objectContaining({
                    context: {
                        __code: CODAMA_ERROR__VERSION_MISMATCH,
                        codamaVersion: CODAMA_VERSION,
                        rootVersion: version,
                    },
                }),
            );
        });
    });
});
