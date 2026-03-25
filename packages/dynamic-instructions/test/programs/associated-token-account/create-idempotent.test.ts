import { findAssociatedTokenPda, getTokenDecoder } from '@solana-program/token';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { ataClient, createMint, tokenClient } from './ata-test-utils';

describe('Associated Token Account: createIdempotent', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true });
    });

    test('should create an associated token account idempotently', async () => {
        const payer = ctx.createFundedAccount();
        const mintAuthority = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const wallet = ctx.createFundedAccount();

        await createMint(ctx, payer, mint, mintAuthority);

        const [ataAddress] = await findAssociatedTokenPda({
            mint,
            owner: wallet,
            tokenProgram: tokenClient.programAddress,
        });

        const ix = await ataClient.methods
            .createIdempotent()
            .accounts({
                associatedAccountAddress: ataAddress,
                fundingAddress: payer,
                tokenMintAddress: mint,
                walletAddress: wallet,
            })
            .instruction();

        ctx.sendInstruction(ix, [payer]);

        const ataAccount = ctx.requireEncodedAccount(ataAddress);
        const tokenData = getTokenDecoder().decode(ataAccount.data);
        expect(ataAccount.owner).toBe(tokenClient.programAddress);
        expect(tokenData.mint).toBe(mint);
        expect(tokenData.owner).toBe(wallet);

        // Call again — should succeed without error
        ctx.advanceSlots();
        ctx.sendInstruction(ix, [payer]);

        const ataAccountAfter = ctx.requireEncodedAccount(ataAddress);
        const tokenDataAfter = getTokenDecoder().decode(ataAccountAfter.data);
        expect(ataAccountAfter.owner).toBe(tokenClient.programAddress);
        expect(tokenDataAfter.mint).toBe(mint);
        expect(tokenDataAfter.owner).toBe(wallet);
    });
});
