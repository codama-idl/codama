import { getMintDecoder, getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, mintTokens, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: burn', () => {
    test('should burn tokens from a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, payer);
        await mintTokens(ctx, payer, mintAccount, tokenAccount, payer, 1_000_000);

        const burnIx = await token2022Client.methods
            .burn({ amount: 400_000 })
            .accounts({ account: tokenAccount, authority: payer, mint: mintAccount })
            .instruction();
        ctx.sendInstruction(burnIx, [payer]);

        const tokenData = getTokenDecoder().decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenData.amount).toBe(600_000n);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mintAccount).data);
        expect(mintData.supply).toBe(600_000n);
    });
});
