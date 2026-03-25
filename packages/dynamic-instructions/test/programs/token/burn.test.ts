import { getMintDecoder, getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, tokenClient } from './token-test-utils';

describe('Token Program: burn', () => {
    test('should burn tokens from a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, payer);

        // Mint tokens first.
        const mintIx = await tokenClient.methods
            .mintTo({ amount: 1_000_000 })
            .accounts({ mint: mintAccount, mintAuthority: payer, token: tokenAccount })
            .instruction();
        ctx.sendInstruction(mintIx, [payer]);

        // Burn tokens.
        const burnIx = await tokenClient.methods
            .burn({ amount: 400_000 })
            .accounts({ account: tokenAccount, authority: payer, mint: mintAccount })
            .instruction();
        ctx.sendInstruction(burnIx, [payer]);

        // Verify token account balance decreased.
        const tokenData = getTokenDecoder().decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenData.amount).toBe(600_000n);

        // Verify mint supply decreased.
        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mintAccount).data);
        expect(mintData.supply).toBe(600_000n);
    });
});
