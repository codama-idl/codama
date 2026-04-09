import { type Address } from '@solana/addresses';
import { findAssociatedTokenPda } from '@solana-program/token';
import {
    deriveAttestationMintPda,
    deriveAttestationPda,
    deriveEventAuthorityAddress,
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

async function createTokenizedAttestationSetup(ctx: SvmTestContext) {
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

    const createIx = await programClient.methods
        .createTokenizedAttestation({
            data: attestationData,
            expiry: 0n,
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

    await ctx.sendInstruction(createIx, [authority]);

    return { attestationMintPda, attestationPda, authority, credentialPda, recipientTokenAccount, sasPda };
}

describe('SAS: closeTokenizedAttestation', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true });
        loadSasProgram(ctx);
    });

    test('should close a tokenized attestation', async () => {
        const { attestationMintPda, attestationPda, authority, credentialPda, recipientTokenAccount, sasPda } =
            await createTokenizedAttestationSetup(ctx);
        const eventAuthority = await deriveEventAuthorityAddress();

        const expectedAccounts = [
            authority,
            authority,
            credentialPda,
            attestationPda,
            eventAuthority,
            ctx.SYSTEM_PROGRAM_ADDRESS,
            programClient.programAddress,
            attestationMintPda,
            sasPda,
            recipientTokenAccount,
            ctx.TOKEN_2022_PROGRAM_ADDRESS,
        ];

        const ix = await programClient.methods
            .closeTokenizedAttestation()
            .accounts({
                attestation: attestationPda,
                attestationMint: attestationMintPda,
                attestationProgram: programClient.programAddress,
                attestationTokenAccount: recipientTokenAccount,
                authority,
                credential: credentialPda,
                eventAuthority,
                payer: authority,
                sasPda,
                tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
            })
            .instruction();

        expect(ix.accounts?.length).toBe(11);
        expectedAccounts.forEach((expected, i) => {
            expect(ix.accounts?.[i].address).eq(expected);
        });
        await ctx.sendInstruction(ix, [authority]);

        const account = ctx.fetchEncodedAccount(attestationPda);
        expect(account).toBeNull();
    });

    test('should throw AccountError when required account is missing', async () => {
        const { attestationMintPda, attestationPda, authority, credentialPda, recipientTokenAccount, sasPda } =
            await createTokenizedAttestationSetup(ctx);

        const eventAuthority = await deriveEventAuthorityAddress();

        await expect(
            programClient.methods
                .closeTokenizedAttestation()
                .accounts({
                    attestation: attestationPda,
                    attestationMint: undefined as unknown as Address,
                    attestationProgram: programClient.programAddress,
                    attestationTokenAccount: recipientTokenAccount,
                    authority,
                    credential: credentialPda,
                    eventAuthority,
                    payer: authority,
                    sasPda,
                    tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
                })
                .instruction(),
        ).rejects.toThrow(/Missing account \[attestationMint\]/);

        await expect(
            programClient.methods
                .closeTokenizedAttestation()
                .accounts({
                    attestation: attestationPda,
                    attestationMint: attestationMintPda,
                    attestationProgram: programClient.programAddress,
                    attestationTokenAccount: undefined as unknown as Address,
                    authority,
                    credential: credentialPda,
                    eventAuthority,
                    payer: authority,
                    sasPda,
                    tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
                })
                .instruction(),
        ).rejects.toThrow(/Missing account \[attestationTokenAccount\]/);
    });
});
