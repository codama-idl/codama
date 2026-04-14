import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: reallocate', () => {
    test('should reallocate a token account to accommodate new extensions', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const tokenAccount = await ctx.createAccount();

        await createMint(ctx, payer, mint, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mint, payer);

        const balanceBefore = ctx.getBalanceOrZero(tokenAccount);

        const ix = await token2022Client.methods
            .reallocate({ newExtensionTypes: ['memoTransfer'] })
            .accounts({ owner: payer, payer, token: tokenAccount })
            .instruction();
        await ctx.sendInstruction(ix, [payer]);

        const balanceAfter = ctx.getBalanceOrZero(tokenAccount);
        expect(balanceAfter).toBeGreaterThan(balanceBefore);
    });
});
