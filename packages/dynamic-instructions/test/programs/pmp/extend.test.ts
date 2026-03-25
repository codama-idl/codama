import { type Address } from '@solana/addresses';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    allocateBufferAccount,
    decodeMetadataAccount,
    initializeCanonicalMetadata,
    loadPmpProgram,
    programClient,
} from './helpers';

describe('Program Metadata: extend', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadPmpProgram(ctx, programClient.programAddress);
    });

    test('should extend buffer capacity', async () => {
        const feePayer = ctx.createFundedAccount();
        const { bufferAccount } = await allocateBufferAccount(ctx);

        const accountBefore = ctx.requireEncodedAccount(bufferAccount);
        const sizeBefore = accountBefore.data.length;

        const extendLength = 500;
        const extendIx = await programClient.methods
            .extend({ length: extendLength })
            .accounts({
                account: bufferAccount,
                authority: bufferAccount,
                program: null,
                programData: null,
            })
            .instruction();

        ctx.sendInstruction(extendIx, [feePayer, bufferAccount]);

        const accountAfter = ctx.requireEncodedAccount(bufferAccount);
        expect(accountAfter.data.length).toBe(sizeBefore + extendLength);
    });

    test('should extend canonical metadata capacity', async () => {
        const {
            authority,
            programAddress,
            programDataAddress,
            pda: metadataPda,
        } = await initializeCanonicalMetadata(ctx);

        const accountBefore = ctx.requireEncodedAccount(metadataPda);
        const sizeBefore = accountBefore.data.length;

        const extendLength = 500;
        const extendIx = await programClient.methods
            .extend({ length: extendLength })
            .accounts({
                account: metadataPda,
                authority,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        ctx.sendInstruction(extendIx, [authority]);

        const accountAfter = ctx.requireEncodedAccount(metadataPda);
        expect(accountAfter.data.length).toBe(sizeBefore + extendLength);

        const metadata = decodeMetadataAccount(accountAfter.data);
        expect(metadata.canonical).toBe(true);
    });

    test('should throw ArgumentError when length argument is missing', async () => {
        const authority = ctx.createFundedAccount();

        await expect(
            programClient.methods
                .extend({ length: undefined as unknown as number })
                .accounts({
                    account: authority,
                    authority,
                    program: null,
                    programData: null,
                })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "length", value: undefined/);
    });

    test('should throw AccountError when required account is missing', async () => {
        await expect(
            programClient.methods
                .extend({ length: 100 })
                .accounts({
                    account: undefined as unknown as Address,
                    authority: undefined as unknown as Address,
                    program: null,
                    programData: null,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: account/);
    });
});
