import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, tokenClient } from './token-test-utils';

describe('Token Program: closeAccount', () => {
    test('should close a token account and transfer lamports to destination', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mintAccount = await ctx.createAccount();
        const tokenAccount = await ctx.createAccount();
        const owner = await ctx.createFundedAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, owner);

        const destBalanceBefore = ctx.getBalanceOrZero(owner);

        const ix = await tokenClient.methods
            .closeAccount()
            .accounts({ account: tokenAccount, destination: owner, owner })
            .instruction();
        await ctx.sendInstruction(ix, [owner]);

        expect(ctx.fetchEncodedAccount(tokenAccount)).toBeNull();
        expect(ctx.getBalanceOrZero(owner)).toBeGreaterThan(destBalanceBefore);
    });
});
