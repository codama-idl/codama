import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: closeAccount', () => {
    test('should close a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();
        const owner = ctx.createFundedAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, owner);

        const ix = await token2022Client.methods
            .closeAccount()
            .accounts({ account: tokenAccount, destination: owner, owner })
            .instruction();
        ctx.sendInstruction(ix, [owner]);

        expect(ctx.fetchEncodedAccount(tokenAccount)).toBeNull();
    });
});
