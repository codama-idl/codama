import { findAssociatedTokenPda, getTokenDecoder } from '@solana-program/token';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { ataClient, createMint, tokenClient } from './ata-test-utils';

describe('Associated Token Account: recoverNested', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true });
    });

    test('should recover tokens from a nested associated token account', async () => {
        const payer = await ctx.createFundedAccount();
        const mintAuthority = await ctx.createFundedAccount();
        const ownerMint = await ctx.createAccount();
        const nestedMint = await ctx.createAccount();
        const wallet = await ctx.createFundedAccount();

        await createMint(ctx, payer, ownerMint, mintAuthority);
        await createMint(ctx, payer, nestedMint, mintAuthority);

        // Create owner ATA (wallet → ownerMint)
        const [ownerAta] = await findAssociatedTokenPda({
            mint: ownerMint,
            owner: wallet,
            tokenProgram: tokenClient.programAddress,
        });
        const createOwnerAtaIx = await ataClient.methods
            .create()
            .accounts({
                associatedAccountAddress: ownerAta,
                fundingAddress: payer,
                tokenMintAddress: ownerMint,
                walletAddress: wallet,
            })
            .instruction();
        await ctx.sendInstruction(createOwnerAtaIx, [payer]);

        // Create nested ATA (ownerAta → nestedMint) — tokens sent here accidentally
        const [nestedAta] = await findAssociatedTokenPda({
            mint: nestedMint,
            owner: ownerAta,
            tokenProgram: tokenClient.programAddress,
        });
        const createNestedAtaIx = await ataClient.methods
            .create()
            .accounts({
                associatedAccountAddress: nestedAta,
                fundingAddress: payer,
                tokenMintAddress: nestedMint,
                walletAddress: ownerAta,
            })
            .instruction();
        await ctx.sendInstruction(createNestedAtaIx, [payer]);

        // Mint tokens to nested ATA
        const amount = BigInt(1_000_000);
        const mintToIx = await tokenClient.methods
            .mintTo({ amount })
            .accounts({ mint: nestedMint, mintAuthority, token: nestedAta })
            .signers(['mintAuthority'])
            .instruction();
        await ctx.sendInstruction(mintToIx, [payer, mintAuthority]);

        // Create destination ATA (wallet → nestedMint)
        const [destinationAta] = await findAssociatedTokenPda({
            mint: nestedMint,
            owner: wallet,
            tokenProgram: tokenClient.programAddress,
        });
        const createDestAtaIx = await ataClient.methods
            .create()
            .accounts({
                associatedAccountAddress: destinationAta,
                fundingAddress: payer,
                tokenMintAddress: nestedMint,
                walletAddress: wallet,
            })
            .instruction();
        await ctx.sendInstruction(createDestAtaIx, [payer]);

        // Recover nested tokens
        const recoverIx = await ataClient.methods
            .recoverNested()
            .accounts({
                destinationAssociatedAccountAddress: destinationAta,
                nestedAssociatedAccountAddress: nestedAta,
                nestedTokenMintAddress: nestedMint,
                ownerAssociatedAccountAddress: ownerAta,
                ownerTokenMintAddress: ownerMint,
                walletAddress: wallet,
            })
            .signers(['walletAddress'])
            .instruction();
        await ctx.sendInstruction(recoverIx, [payer, wallet]);

        // Verify tokens moved to destination
        const destAccount = ctx.requireEncodedAccount(destinationAta);
        const destTokenData = getTokenDecoder().decode(destAccount.data);
        expect(destTokenData.amount).toBe(amount);
    });
});
