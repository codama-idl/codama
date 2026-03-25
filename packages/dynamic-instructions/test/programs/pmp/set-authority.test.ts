import type { Address } from '@solana/addresses';
import type { Some } from '@solana/codecs';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { decodeMetadataAccount, initializeCanonicalMetadata, loadPmpProgram, programClient } from './helpers';

describe('Program Metadata: setAuthority', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadPmpProgram(ctx, programClient.programAddress);
    });

    test('should set new authority on canonical metadata', async () => {
        const {
            authority,
            programAddress,
            programDataAddress,
            pda: metadataPda,
        } = await initializeCanonicalMetadata(ctx);

        const accountBefore = ctx.requireEncodedAccount(metadataPda);
        const metadataBefore = decodeMetadataAccount(accountBefore.data);
        expect(metadataBefore.authority).toEqual({ __option: 'None' });
        expect(metadataBefore.canonical).toBe(true);

        // Set new authority
        const newAuthority = ctx.createAccount();
        const expectedAccounts = [metadataPda, authority, programAddress, programDataAddress];
        const setAuthorityIx = await programClient.methods
            .setAuthority({ newAuthority })
            .accounts({
                account: metadataPda,
                authority,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        expect(setAuthorityIx.accounts?.length).toBe(4);
        setAuthorityIx.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });

        ctx.sendInstruction(setAuthorityIx, [authority]);
        const accountAfter = ctx.requireEncodedAccount(metadataPda);
        const metadataAfter = decodeMetadataAccount(accountAfter.data);
        expect((metadataAfter.authority as Some<Address>).value).toBe(newAuthority);
    });

    test('should remove authority from canonical metadata', async () => {
        const {
            authority,
            programAddress,
            programDataAddress,
            pda: metadataPda,
        } = await initializeCanonicalMetadata(ctx);

        // Set authority
        const someAuthority = ctx.createAccount();
        const setAuthorityIx = await programClient.methods
            .setAuthority({ newAuthority: someAuthority })
            .accounts({
                account: metadataPda,
                authority,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        ctx.sendInstruction(setAuthorityIx, [authority]);
        const accountWithAuthority = ctx.requireEncodedAccount(metadataPda);
        const metadataWithAuthority = decodeMetadataAccount(accountWithAuthority.data);
        expect((metadataWithAuthority.authority as Some<Address>).value).toBe(someAuthority);

        // Remove the authority
        const expectedAccounts = [metadataPda, authority, programAddress, programDataAddress];
        const removeAuthorityIx = await programClient.methods
            .setAuthority({ newAuthority: null })
            .accounts({
                account: metadataPda,
                authority,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        expect(removeAuthorityIx.accounts?.length).toBe(4);
        removeAuthorityIx.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });

        ctx.sendInstruction(removeAuthorityIx, [authority]);
        const accountAfter = ctx.requireEncodedAccount(metadataPda);
        const metadataAfter = decodeMetadataAccount(accountAfter.data);
        expect(metadataAfter.authority).toEqual({ __option: 'None' });
    });
});
