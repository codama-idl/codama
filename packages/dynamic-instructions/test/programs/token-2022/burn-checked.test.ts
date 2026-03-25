import { getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, mintTokens, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: burnChecked', () => {
    test('should burn_checked tokens', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, payer);
        await mintTokens(ctx, payer, mintAccount, tokenAccount, payer, 1_000_000);

        const ix = await token2022Client.methods
            .burnChecked({ amount: 400_000, decimals: 9 })
            .accounts({ account: tokenAccount, authority: payer, mint: mintAccount })
            .instruction();
        ctx.sendInstruction(ix, [payer]);

        const decoder = getTokenDecoder();
        const tokenData = decoder.decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenData.amount).toBe(600_000n);
    });
});
