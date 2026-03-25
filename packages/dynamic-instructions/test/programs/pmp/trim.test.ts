import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { decodeMetadataAccount, initializeCanonicalMetadata, loadPmpProgram, programClient } from './helpers';

describe('Program Metadata: trim', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true, sysvars: true });
        loadPmpProgram(ctx, programClient.programAddress);
    });

    test('should trim metadata to reduced size', async () => {
        const destination = ctx.createAccount();
        const {
            authority,
            programAddress,
            programDataAddress,
            pda: metadataPda,
        } = await initializeCanonicalMetadata(ctx, { data: new TextEncoder().encode('x'.repeat(200)) });

        const reducedData = new TextEncoder().encode('x'.repeat(100));
        const setDataIx = await programClient.methods
            .setData({
                compression: 'none',
                data: reducedData,
                dataSource: 'direct',
                encoding: 'utf8',
                format: 'json',
            })
            .accounts({
                authority,
                buffer: null,
                metadata: metadataPda,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();
        ctx.sendInstruction(setDataIx, [authority]);

        const balanceBefore = ctx.getBalanceOrZero(destination);
        expect(balanceBefore).toBe(0n);

        const expectedAccounts = [
            metadataPda,
            authority,
            programAddress,
            programDataAddress,
            destination,
            ctx.SYSVAR_RENT_ADDRESS,
        ];

        const trimIx = await programClient.methods
            .trim()
            .accounts({
                account: metadataPda,
                authority,
                destination,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();
        expect(trimIx.accounts?.length).toBe(6);
        trimIx.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });
        ctx.sendInstruction(trimIx, [authority]);

        const account = ctx.requireEncodedAccount(metadataPda);
        const metadata = decodeMetadataAccount(account.data);
        expect(metadata.data).toEqual(reducedData);

        const balanceAfter = ctx.getBalanceOrZero(destination);
        expect(balanceAfter).toBeGreaterThan(0n);
    });
});
