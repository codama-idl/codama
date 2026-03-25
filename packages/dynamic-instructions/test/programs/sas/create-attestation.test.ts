import { type Address } from '@solana/addresses';
import { deriveAttestationPda, getAttestationDecoder, serializeAttestationData } from 'sas-lib';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createAttestation, createCredential, createSchema, loadSasProgram, programClient } from './sas-test-utils';

describe('SAS: createAttestation', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadSasProgram(ctx);
    });

    test('should create an attestation with no expiry', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);
        const nonce = ctx.createAccount();

        const [attestationPda] = await deriveAttestationPda({ credential: credentialPda, nonce, schema: schemaPda });

        const expectedAccounts = [
            authority,
            authority,
            credentialPda,
            schemaPda,
            attestationPda,
            ctx.SYSTEM_PROGRAM_ADDRESS,
        ];
        const ix = await programClient.methods
            .createAttestation({ data: new Uint8Array([0, 0, 0, 0]), expiry: 0, nonce })
            .accounts({
                attestation: attestationPda,
                authority,
                credential: credentialPda,
                payer: authority,
                schema: schemaPda,
            })
            .instruction();

        expect(ix.accounts?.length).toBe(6);
        expectedAccounts.forEach((expected, i) => {
            expect(ix.accounts?.[i].address).eq(expected);
        });
        ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(attestationPda);
        const attestation = getAttestationDecoder().decode(account.data);
        expect(attestation.data).toEqual(new Uint8Array([0, 0, 0, 0]));
        expect(attestation.expiry).toBe(0n);
    });

    test('should create an attestation with binary data', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda, schema } = await createSchema(ctx, authority, credentialPda);
        const attestationData = serializeAttestationData(schema, { field1: 'test' });

        const { attestationPda } = await createAttestation(ctx, authority, credentialPda, schemaPda, {
            data: attestationData,
        });

        const account = ctx.requireEncodedAccount(attestationPda);
        const attestation = getAttestationDecoder().decode(account.data);
        expect(attestation.data).toEqual(new Uint8Array(attestationData));
        expect(attestation.expiry).toBe(0n);
    });

    test('should throw AccountError when attestation is missing', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);
        const nonce = ctx.createAccount();

        await expect(
            programClient.methods
                .createAttestation({ data: new Uint8Array([]), expiry: 0n, nonce })
                .accounts({
                    attestation: undefined as unknown as Address,
                    authority,
                    credential: credentialPda,
                    payer: authority,
                    schema: schemaPda,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: attestation/);
    });

    test('should throw ArgumentError when nonce is invalid', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);
        const nonce = ctx.createAccount();
        const [attestationPda] = await deriveAttestationPda({ credential: credentialPda, nonce, schema: schemaPda });

        await expect(
            programClient.methods
                .createAttestation({
                    data: new Uint8Array([]),
                    expiry: 0n,
                    nonce: 'not-a-valid-address' as unknown as Address,
                })
                .accounts({
                    attestation: attestationPda,
                    authority,
                    credential: credentialPda,
                    payer: authority,
                    schema: schemaPda,
                })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "nonce"/);
    });
});
