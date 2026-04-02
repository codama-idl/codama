import { getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, tokenClient } from './token-test-utils';

describe('Token Program: burnChecked', () => {
    test('should burn tokens with decimals verification', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mintAccount = await ctx.createAccount();
        const tokenAccount = await ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, payer);

        const mintIx = await tokenClient.methods
            .mintTo({ amount: 1_000_000 })
            .accounts({ mint: mintAccount, mintAuthority: payer, token: tokenAccount })
            .instruction();
        await ctx.sendInstruction(mintIx, [payer]);

        const ix = await tokenClient.methods
            .burnChecked({ amount: 400_000, decimals: 9 })
            .accounts({ account: tokenAccount, authority: payer, mint: mintAccount })
            .instruction();
        await ctx.sendInstruction(ix, [payer]);

        const decoder = getTokenDecoder();
        const tokenData = decoder.decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenData.amount).toBe(600_000n);
    });
});
