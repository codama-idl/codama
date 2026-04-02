import { type Address } from '@solana/addresses';
import { findAssociatedTokenPda } from '@solana-program/token';
import {
    deriveAttestationMintPda,
    deriveAttestationPda,
    getAttestationDecoder,
    serializeAttestationData,
} from 'sas-lib';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    createCredential,
    createSchema,
    getAttestationMintSize,
    loadSasProgram,
    programClient,
    tokenizeSchema,
} from './sas-test-utils';

const NFT_NAME = 'Test NFT';
const NFT_SYMBOL = 'TEST';
const NFT_URI = 'https://example.com/metadata.json';

describe('SAS: createTokenizedAttestation', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true });
        loadSasProgram(ctx);
    });

    test('should create a tokenized attestation', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda, schema } = await createSchema(ctx, authority, credentialPda);
        const attestationData = serializeAttestationData(schema, { field1: 'test' });
        const { sasPda, schemaMintPda } = await tokenizeSchema(ctx, authority, credentialPda, schemaPda);

        const nonce = await ctx.createAccount();
        const recipient = await ctx.createFundedAccount();
        const [attestationPda] = await deriveAttestationPda({ credential: credentialPda, nonce, schema: schemaPda });
        const [attestationMintPda] = await deriveAttestationMintPda({ attestation: attestationPda });

        const [recipientTokenAccount] = await findAssociatedTokenPda({
            mint: attestationMintPda,
            owner: recipient,
            tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
        });

        const mintAccountSpace = getAttestationMintSize({
            attestationMint: attestationMintPda,
            attestationPda,
            name: NFT_NAME,
            sasPda,
            schemaMint: schemaMintPda,
            schemaPda,
            symbol: NFT_SYMBOL,
            uri: NFT_URI,
        });

        const expectedAccounts = [
            authority,
            authority,
            credentialPda,
            schemaPda,
            attestationPda,
            ctx.SYSTEM_PROGRAM_ADDRESS,
            schemaMintPda,
            attestationMintPda,
            sasPda,
            recipientTokenAccount,
            recipient,
            ctx.TOKEN_2022_PROGRAM_ADDRESS,
            ctx.ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        ];
        const ix = await programClient.methods
            .createTokenizedAttestation({
                data: attestationData,
                expiry: 0,
                mintAccountSpace,
                name: NFT_NAME,
                nonce,
                symbol: NFT_SYMBOL,
                uri: NFT_URI,
            })
            .accounts({
                associatedTokenProgram: ctx.ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                attestation: attestationPda,
                attestationMint: attestationMintPda,
                authority,
                credential: credentialPda,
                payer: authority,
                recipient,
                recipientTokenAccount,
                sasPda,
                schema: schemaPda,
                schemaMint: schemaMintPda,
                tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
            })
            .instruction();

        expect(ix.accounts?.length).toBe(13);
        expectedAccounts.forEach((expected, i) => {
            expect(ix.accounts?.[i].address).eq(expected);
        });

        await ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(attestationPda);
        const attestation = getAttestationDecoder().decode(account.data);
        expect(attestation).toMatchObject({
            credential: credentialPda,
            data: new Uint8Array(attestationData),
            discriminator: 2,
            expiry: 0n,
            schema: schemaPda,
        });
    });

    test('should throw AccountError when schemaMint is missing', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);
        const { sasPda } = await tokenizeSchema(ctx, authority, credentialPda, schemaPda);

        const nonce = await ctx.createAccount();
        const recipient = await ctx.createFundedAccount();
        const [attestationPda] = await deriveAttestationPda({ credential: credentialPda, nonce, schema: schemaPda });
        const [attestationMintPda] = await deriveAttestationMintPda({ attestation: attestationPda });

        const [recipientTokenAccount] = await findAssociatedTokenPda({
            mint: attestationMintPda,
            owner: recipient,
            tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
        });

        await expect(
            programClient.methods
                .createTokenizedAttestation({
                    data: new Uint8Array([]),
                    expiry: 0n,
                    mintAccountSpace: 234,
                    name: NFT_NAME,
                    nonce,
                    symbol: NFT_SYMBOL,
                    uri: NFT_URI,
                })
                .accounts({
                    associatedTokenProgram: ctx.ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                    attestation: attestationPda,
                    attestationMint: attestationMintPda,
                    authority,
                    credential: credentialPda,
                    payer: authority,
                    recipient,
                    recipientTokenAccount,
                    sasPda,
                    schema: schemaPda,
                    schemaMint: undefined as unknown as Address,
                    tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: schemaMint/);
    });

    test('should throw error with invalid argument', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);
        const { sasPda } = await tokenizeSchema(ctx, authority, credentialPda, schemaPda);

        const nonce = await ctx.createAccount();
        const recipient = await ctx.createFundedAccount();
        const [attestationPda] = await deriveAttestationPda({ credential: credentialPda, nonce, schema: schemaPda });
        const [attestationMintPda] = await deriveAttestationMintPda({ attestation: attestationPda });

        const [recipientTokenAccount] = await findAssociatedTokenPda({
            mint: attestationMintPda,
            owner: recipient,
            tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
        });

        await expect(
            programClient.methods
                .createTokenizedAttestation({
                    data: { a: 42 } as unknown as Uint8Array,
                    expiry: 0n,
                    mintAccountSpace: 234,
                    name: NFT_NAME,
                    nonce,
                    symbol: NFT_SYMBOL,
                    uri: NFT_URI,
                })
                .accounts({
                    associatedTokenProgram: ctx.ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
                    attestation: attestationPda,
                    attestationMint: attestationMintPda,
                    authority,
                    credential: credentialPda,
                    payer: authority,
                    recipient,
                    recipientTokenAccount,
                    sasPda,
                    schema: schemaPda,
                    schemaMint: undefined as unknown as Address,
                    tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
                })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "data"/);
    });
});
