import { findAssociatedTokenPda, getTokenDecoder } from '@solana-program/token';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { ataClient, createMint, tokenClient } from './ata-test-utils';

describe('Associated Token Account: create', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true });
    });

    test('should create an associated token account', async () => {
        const payer = await ctx.createFundedAccount();
        const mintAuthority = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const wallet = await ctx.createFundedAccount();

        await createMint(ctx, payer, mint, mintAuthority);

        const [ataAddress] = await findAssociatedTokenPda({
            mint,
            owner: wallet,
            tokenProgram: tokenClient.programAddress,
        });

        const ix = await ataClient.methods
            .create()
            .accounts({
                associatedAccountAddress: ataAddress,
                fundingAddress: payer,
                tokenMintAddress: mint,
                walletAddress: wallet,
            })
            .instruction();

        await ctx.sendInstruction(ix, [payer]);

        const ataAccount = ctx.requireEncodedAccount(ataAddress);
        const tokenData = getTokenDecoder().decode(ataAccount.data);
        expect(ataAccount.owner).toBe(tokenClient.programAddress);
        expect(tokenData.mint).toBe(mint);
        expect(tokenData.owner).toBe(wallet);
    });
});
