import { type Address } from '@solana/addresses';
import { deriveEventAuthorityAddress } from 'sas-lib';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createAttestation, createCredential, createSchema, loadSasProgram, programClient } from './sas-test-utils';

describe('SAS: closeAttestation', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadSasProgram(ctx);
    });

    test('should close an attestation', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);
        const { attestationPda } = await createAttestation(ctx, authority, credentialPda, schemaPda);
        const eventAuthority = await deriveEventAuthorityAddress();

        const expectedAccounts = [
            authority,
            authority,
            credentialPda,
            attestationPda,
            eventAuthority,
            ctx.SYSTEM_PROGRAM_ADDRESS,
            programClient.programAddress,
        ];
        const ix = await programClient.methods
            .closeAttestation()
            .accounts({
                attestation: attestationPda,
                attestationProgram: programClient.programAddress,
                authority,
                credential: credentialPda,
                eventAuthority,
                payer: authority,
            })
            .instruction();

        expect(ix.accounts?.length).toBe(7);
        expectedAccounts.forEach((expected, i) => {
            expect(ix.accounts?.[i].address).eq(expected);
        });
        ctx.sendInstruction(ix, [authority]);

        const account = ctx.fetchEncodedAccount(attestationPda);
        expect(account).toBeNull();
    });

    test('should throw AccountError when required account is missing', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);
        const { attestationPda } = await createAttestation(ctx, authority, credentialPda, schemaPda);
        const eventAuthority = await deriveEventAuthorityAddress();

        await expect(
            programClient.methods
                .closeAttestation()
                .accounts({
                    attestation: attestationPda,
                    attestationProgram: programClient.programAddress,
                    authority,
                    credential: credentialPda,
                    eventAuthority: undefined as unknown as Address,
                    payer: authority,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: eventAuthority/);

        await expect(
            programClient.methods
                .closeAttestation()
                .accounts({
                    attestation: attestationPda,
                    attestationProgram: programClient.programAddress,
                    authority,
                    credential: undefined as unknown as Address,
                    eventAuthority: eventAuthority,
                    payer: authority,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: credential/);

        await expect(
            programClient.methods
                .closeAttestation()
                .accounts({
                    attestation: attestationPda,
                    attestationProgram: undefined as unknown as Address,
                    authority,
                    credential: credentialPda,
                    eventAuthority: eventAuthority,
                    payer: authority,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: attestationProgram/);
    });
});
