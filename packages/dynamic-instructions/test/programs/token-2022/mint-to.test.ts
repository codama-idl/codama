import { getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: mintTo', () => {
    test('should mint tokens to a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, payer);

        const ix = await token2022Client.methods
            .mintTo({ amount: 1_000_000 })
            .accounts({ mint: mintAccount, mintAuthority: payer, token: tokenAccount })
            .instruction();

        ctx.sendInstruction(ix, [payer]);

        const account = ctx.requireEncodedAccount(tokenAccount);
        const tokenData = getTokenDecoder().decode(account.data);
        expect(tokenData.amount).toBe(1_000_000n);
    });
});
