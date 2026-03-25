import type { Address } from '@solana/addresses';
import type { Some } from '@solana/codecs';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    decodeMetadataAccount,
    initializeCanonicalMetadata,
    initializeNonCanonicalMetadata,
    loadPmpProgram,
    PMP_PROGRAM_ID,
    programClient,
} from './helpers';

describe('Program Metadata: setImmutable', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadPmpProgram(ctx, programClient.programAddress);
    });

    test('should make canonical metadata immutable', async () => {
        const {
            authority,
            programAddress,
            programDataAddress,
            pda: metadataPda,
        } = await initializeCanonicalMetadata(ctx);

        const accountBefore = ctx.requireEncodedAccount(metadataPda);
        const metadataBefore = decodeMetadataAccount(accountBefore.data);
        expect(metadataBefore.mutable).toBe(true);
        expect(metadataBefore.canonical).toBe(true);

        // Make immutable
        const expectedAccounts = [metadataPda, authority, programAddress, programDataAddress];

        const setImmutableIx = await programClient.methods
            .setImmutable()
            .accounts({
                authority,
                metadata: metadataPda,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        expect(setImmutableIx.accounts?.length).toBe(4);
        setImmutableIx.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });

        ctx.sendInstruction(setImmutableIx, [authority]);

        const accountAfter = ctx.requireEncodedAccount(metadataPda);
        const metadataAfter = decodeMetadataAccount(accountAfter.data);
        expect(metadataAfter.mutable).toBe(false);
    });

    test('should make non-canonical metadata immutable', async () => {
        const { authority, pda: metadataPda } = await initializeNonCanonicalMetadata(ctx);

        // Verify non-canonical and mutable
        const accountBefore = ctx.requireEncodedAccount(metadataPda);
        const metadataBefore = decodeMetadataAccount(accountBefore.data);
        expect(metadataBefore.canonical).toBe(false);
        expect(metadataBefore.mutable).toBe(true);
        expect((metadataBefore.authority as Some<Address>).value).toBe(authority);

        // Make immutable
        const expectedAccounts = [metadataPda, authority, PMP_PROGRAM_ID, PMP_PROGRAM_ID];

        const setImmutableIx = await programClient.methods
            .setImmutable()
            .accounts({
                authority,
                metadata: metadataPda,
                program: null,
                programData: null,
            })
            .instruction();

        expect(setImmutableIx.accounts?.length).toBe(4);
        setImmutableIx.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });

        ctx.sendInstruction(setImmutableIx, [authority]);

        const accountAfter = ctx.requireEncodedAccount(metadataPda);
        const metadataAfter = decodeMetadataAccount(accountAfter.data);
        expect(metadataAfter.mutable).toBe(false);
        expect(metadataAfter.canonical).toBe(false);
        expect((metadataAfter.authority as Some<Address>).value).toBe(authority);
    });
});
