import { getNodeCodec } from '@codama/dynamic-codecs';
import { type Address, getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
import { getU64Encoder, type Option, unwrapOption } from '@solana/codecs';
import type { RootNode } from 'codama';
import { beforeEach, describe, expect, test } from 'vitest';

import { createProgramClient } from '../../../../src';
import type { ExampleProgramClient } from '../../generated/example-idl-types';
import { SvmTestContext } from '../../test-utils';
import { createTestContext, idl, programClient } from './helpers';

describe('anchor-example: commonIxs', () => {
    let ctx: SvmTestContext;
    let payer: Address;

    beforeEach(() => {
        ({ ctx, payer } = createTestContext());
    });

    describe('pubkeySeedIx', () => {
        test('should execute instruction with pubkey seed', async () => {
            const ix = await programClient.methods
                .pubkeySeedIx({ input: 42 })
                .accounts({ signer: payer })
                .instruction();

            ctx.sendInstruction(ix, [payer]);
        });
    });

    describe('updateOptionalInput', () => {
        test('should update optional input field with and without value', async () => {
            const signer = ctx.createFundedAccount();

            const ix0 = await programClient.methods.pubkeySeedIx({ input: 42 }).accounts({ signer }).instruction();

            ctx.sendInstruction(ix0, [signer]);

            const [pda] = await getProgramDerivedAddress({
                programAddress: programClient.programAddress,
                seeds: ['seed', getAddressEncoder().encode(signer)],
            });

            const optionalAddress = ctx.createAccount();
            const ix1 = await programClient.methods
                .updateOptionalInput({
                    input: 44,
                    optionalInput: optionalAddress,
                })
                .accounts({ signer })
                .instruction();

            ctx.sendInstruction(ix1, [signer]);

            const account1 = ctx.requireEncodedAccount(pda);
            const decoded1 = decodeDataAccount1(programClient.root, account1.data);
            expect(decoded1.optionalInput).eq(optionalAddress);

            const ix2 = await programClient.methods
                .updateOptionalInput({ input: 45 })
                .accounts({ signer })
                .instruction();

            ctx.sendInstruction(ix2, [signer]);

            const account2 = ctx.requireEncodedAccount(pda);
            const decoded2 = decodeDataAccount1(programClient.root, account2.data);
            expect(decoded2.optionalInput).toBeNull();
        });
    });

    describe('updateOptionalAccount', () => {
        test('should handle optional accounts', async () => {
            const optionalAccount = ctx.createAccount();
            const ix1 = await programClient.methods
                .updateOptionalAccount({ id: 1 })
                .accounts({
                    optionalAccKey: optionalAccount,
                    signer: payer,
                })
                .instruction();

            ctx.sendInstruction(ix1, [payer]);

            const ix2 = await programClient.methods
                .updateOptionalAccount({ id: 2 })
                .accounts({
                    optionalAccKey: null,
                    signer: payer,
                })
                .instruction();

            ctx.sendInstruction(ix2, [payer]);
        });
    });

    describe('noArguments', () => {
        test('should execute instruction with no arguments', async () => {
            const account = ctx.createAccount();

            const ix = await programClient.methods
                .noArguments()
                .accounts({
                    acc: account,
                    signer: payer,
                })
                .instruction();

            ctx.sendInstruction(ix, [payer, account]);
        });
    });

    test('ExternalProgramsWithPdaIx: should resolve dependent pda and external program addresses', async () => {
        const mint = ctx.createAccount();
        const addressEncoder = getAddressEncoder();
        const [expectedAta] = await getProgramDerivedAddress({
            programAddress: ctx.ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
            seeds: [
                addressEncoder.encode(payer),
                addressEncoder.encode(ctx.TOKEN_PROGRAM_ADDRESS),
                addressEncoder.encode(mint),
            ],
        });

        const [expectedDependentPda] = await getProgramDerivedAddress({
            programAddress: programClient.programAddress,
            seeds: ['signer_and_ata', addressEncoder.encode(payer), addressEncoder.encode(expectedAta)],
        });

        const ix = await programClient.methods
            .externalProgramsWithPda()
            .accounts({
                mint,
                signer: payer,
            })
            .instruction();

        expect(ix.accounts).toBeDefined();
        if (!ix.accounts) throw new Error('Expected instruction accounts to be defined');

        expect(ix.accounts.length).eq(8);

        const expectedAccounts = [
            [payer, "signer doesn't match"],
            [mint, "mint doesn't match"],
            [expectedAta, "token_account doesn't match"],
            [expectedDependentPda, "dependent_account doesn't match"],
            [ctx.SYSTEM_PROGRAM_ADDRESS, "system_program doesn't match"],
            [ctx.TOKEN_PROGRAM_ADDRESS, "token_program doesn't match"],
            [ctx.ASSOCIATED_TOKEN_PROGRAM_ADDRESS, "associated_token_program doesn't match"],
            [ctx.SYSVAR_RENT_ADDRESS, "rent_sysvar doesn't match"],
        ];

        expectedAccounts.forEach((expected, i) => {
            if (!ix?.accounts?.[i]) {
                throw new Error(`Expected instruction accounts to be defined at index ${i}`);
            }
            expect(ix.accounts[i].address, expected[1]).eq(expected[0]);
        });

        // Send transaction to verify it executes on-chain
        ctx.sendInstruction(ix, [payer, mint]);
    });

    test('FourLevelPdaIx: should resolve four-level dependent PDA', async () => {
        const ix = await programClient.methods
            .fourLevelPda()
            .accounts({
                signer: payer,
            })
            .instruction();

        expect(ix.accounts).toBeDefined();
        if (!ix.accounts) throw new Error('Expected instruction accounts to be defined');
        expect(ix.accounts.length).eq(6);

        const addressEncoder = getAddressEncoder();

        const [expectedLevel1] = await getProgramDerivedAddress({
            programAddress: programClient.programAddress,
            seeds: ['level1', addressEncoder.encode(payer)],
        });

        const [expectedLevel2] = await getProgramDerivedAddress({
            programAddress: programClient.programAddress,
            seeds: ['level2', addressEncoder.encode(expectedLevel1)],
        });

        const [expectedLevel3] = await getProgramDerivedAddress({
            programAddress: programClient.programAddress,
            seeds: ['level3', addressEncoder.encode(expectedLevel2)],
        });

        const [expectedLevel4] = await getProgramDerivedAddress({
            programAddress: programClient.programAddress,
            seeds: ['level4', addressEncoder.encode(expectedLevel3)],
        });

        const expectedAccounts = [
            [payer, "signer doesn't match"],
            [expectedLevel1, "level1 doesn't match"],
            [expectedLevel2, "level2 doesn't match"],
            [expectedLevel3, "level3 doesn't match"],
            [expectedLevel4, "level4 doesn't match"],
            [ctx.SYSTEM_PROGRAM_ADDRESS, "system_program doesn't match"],
        ];

        expectedAccounts.forEach((expected, i) => {
            if (!ix?.accounts?.[i]) {
                throw new Error(`Expected instruction accounts to be defined at index ${i}`);
            }
            expect(ix.accounts[i].address, expected[1]).eq(expected[0]);
        });

        ctx.sendInstruction(ix, [payer]);
    });

    describe('stringSeedPda', () => {
        test('should derive PDA using raw string seed bytes (not size-prefixed)', async () => {
            const name = 'hello';
            const id = 7;

            const ix = await programClient.methods
                .stringSeedPda({ id, name })
                .accounts({ signer: payer })
                .instruction();

            ctx.sendInstruction(ix, [payer]);

            const [expectedPda] = await getProgramDerivedAddress({
                programAddress: programClient.programAddress,
                seeds: [getU64Encoder().encode(id), name],
            });

            const account = ctx.requireEncodedAccount(expectedPda);
            expect(account.owner).toBe(programClient.programAddress);

            const decoded = decodeDataAccount1(programClient.root, account.data);
            expect(decoded.input).toBe(7n);
        });
    });

    describe('Circular Dependency Detection', () => {
        test('SelfReferencePdaIx: should throw AccountError for A->A cycle', async () => {
            await expect(
                programClient.methods.selfReferencePda().accounts({ signer: payer }).instruction(),
            ).rejects.toThrow(/Circular dependency detected: recursive -> recursive/);
        });

        test('TwoNodeCyclePdaIx: should throw AccountError for A->B->A pattern in two-node cycle', async () => {
            await expect(
                programClient.methods.twoNodeCyclePda().accounts({ signer: payer }).instruction(),
            ).rejects.toThrow(/Circular dependency detected: pda[AB] -> pda[AB] -> pda[AB]/);
        });
    });

    describe('Standalone PDA derivation — pdaNode.programId', () => {
        const addressEncoder = getAddressEncoder();

        test('should derive cross-program PDA using pdaNode.programId, not root program', async () => {
            const signer = SvmTestContext.generateAddress();
            const mint = SvmTestContext.generateAddress();

            const [actualPda] = await programClient.pdas.tokenAccount({ mint, signer });

            const [expectedPda] = await getProgramDerivedAddress({
                programAddress: ctx.ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                seeds: [
                    addressEncoder.encode(signer),
                    addressEncoder.encode(ctx.TOKEN_PROGRAM_ADDRESS),
                    addressEncoder.encode(mint),
                ],
            });
            expect(actualPda).toBe(expectedPda);
        });

        test('should not be affected by programId option override and still use pdaNode.programId', async () => {
            const signer = SvmTestContext.generateAddress();
            const mint = SvmTestContext.generateAddress();

            const overrideProgramId = SvmTestContext.generateAddress();
            const overrideClient = createProgramClient<ExampleProgramClient>(idl, { programId: overrideProgramId });
            // double-check that the override took effect
            expect(overrideClient.programAddress).toBe(overrideProgramId);

            const [pdaFromOriginal] = await programClient.pdas.tokenAccount({ mint, signer });
            const [pdaFromOverride] = await overrideClient.pdas.tokenAccount({ mint, signer });

            expect(pdaFromOverride).toBe(pdaFromOriginal);
        });

        test('should fall back to root program when pdaNode has no programId', async () => {
            const signer = SvmTestContext.generateAddress();

            const [actualPda] = await programClient.pdas.level1({ signer });

            const [expectedPda] = await getProgramDerivedAddress({
                programAddress: programClient.programAddress,
                seeds: ['level1', addressEncoder.encode(signer)],
            });
            expect(actualPda).toBe(expectedPda);
        });
    });
});

function decodeDataAccount1(
    root: RootNode,
    data: Uint8Array,
): { bump: number; input: bigint; optionalInput: string | null } {
    const accountNode = root.program.accounts.find(a => a.name === 'dataAccount1');
    if (!accountNode) {
        throw new Error('Could not find account node "dataAccount1" in IDL');
    }

    const codec = getNodeCodec([root, root.program, accountNode]);
    const decoded = codec.decode(Uint8Array.from(data)) as {
        bump: number;
        input: bigint;
        optionalInput: Option<string>;
    };

    return {
        bump: decoded.bump,
        input: decoded.input,
        optionalInput: unwrapOption<string>(decoded.optionalInput),
    };
}
