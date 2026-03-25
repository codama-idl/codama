import { type Address } from '@solana/addresses';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    allocateBufferAccount,
    decodeBufferAccount,
    initializeCanonicalMetadata,
    loadPmpProgram,
    programClient,
    setupCanonicalPda,
} from './helpers';

describe('Program Metadata: close', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadPmpProgram(ctx, programClient.programAddress);
    });

    test('should close canonical PDA buffer', async () => {
        const destination = ctx.createFundedAccount();
        const { authority, programAddress, programDataAddress, pda: bufferPda } = await setupCanonicalPda(ctx);

        const allocateIx = await programClient.methods
            .allocate({ seed: 'idl' })
            .accounts({
                authority,
                buffer: bufferPda,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        ctx.sendInstruction(allocateIx, [authority]);

        const bufferAccount = ctx.requireEncodedAccount(bufferPda);
        expect(bufferAccount).not.toBeNull();

        const destinationBalanceBefore = ctx.getBalanceOrZero(destination);

        const closeIx = await programClient.methods
            .close()
            .accounts({
                account: bufferPda,
                authority,
                destination,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        ctx.sendInstruction(closeIx, [authority]);

        const closedAccount = ctx.fetchEncodedAccount(bufferPda);
        expect(closedAccount).toBeNull();

        const destinationBalanceAfter = ctx.getBalanceOrZero(destination);
        expect(destinationBalanceAfter).toBeGreaterThan(destinationBalanceBefore);
    });

    test('should close mutable metadata', async () => {
        const destination = ctx.createFundedAccount();
        const {
            authority,
            programAddress,
            programDataAddress,
            pda: metadataPda,
        } = await initializeCanonicalMetadata(ctx);

        const destinationBalanceBefore = ctx.getBalanceOrZero(destination);

        const closeIx = await programClient.methods
            .close()
            .accounts({
                account: metadataPda,
                authority,
                destination,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        ctx.sendInstruction(closeIx, [authority]);

        const closedAccount = ctx.fetchEncodedAccount(metadataPda);
        expect(closedAccount).toBeNull();

        const destinationBalanceAfter = ctx.getBalanceOrZero(destination);
        expect(destinationBalanceAfter).toBeGreaterThan(destinationBalanceBefore);
    });

    test('should close buffer account', async () => {
        const feePayer = ctx.createFundedAccount();
        const destination = ctx.createFundedAccount();
        const { bufferAccount } = await allocateBufferAccount(ctx);

        const buffer = ctx.requireEncodedAccount(bufferAccount);
        const decoded = decodeBufferAccount(buffer.data);
        expect(decoded.canonical).toBe(false);

        const destinationBalanceBefore = ctx.getBalanceOrZero(destination);

        const closeIx = await programClient.methods
            .close()
            .accounts({
                account: bufferAccount,
                authority: bufferAccount,
                destination,
                program: null,
                programData: null,
            })
            .instruction();

        ctx.sendInstruction(closeIx, [feePayer, bufferAccount]);

        const destinationBalanceAfter = ctx.getBalanceOrZero(destination);
        expect(destinationBalanceAfter).toBeGreaterThan(destinationBalanceBefore);

        const closedAccount = ctx.fetchEncodedAccount(bufferAccount);
        expect(closedAccount).toBeNull();
    });

    test('should throw AccountError when destination is missing', async () => {
        const authority = ctx.createFundedAccount();

        await expect(
            programClient.methods
                .close()
                .accounts({
                    account: authority,
                    authority,
                    destination: undefined as unknown as Address,
                    program: null,
                    programData: null,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: destination/);
    });
});
