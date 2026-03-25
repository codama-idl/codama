import { getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, tokenClient } from './token-test-utils';

describe('Token Program: mintTo', () => {
    test('should mint tokens to a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, payer);

        const ix = await tokenClient.methods
            .mintTo({ amount: 1_000_000 })
            .accounts({ mint: mintAccount, mintAuthority: payer, token: tokenAccount })
            .instruction();

        ctx.sendInstruction(ix, [payer]);

        const account = ctx.requireEncodedAccount(tokenAccount);
        const tokenData = getTokenDecoder().decode(account.data);
        expect(tokenData.amount).toBe(1_000_000n);
    });
});
