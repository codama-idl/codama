import { getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, mintTokens, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: transferChecked', () => {
    test('should transfer_checked tokens', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const sourceAccount = ctx.createAccount();
        const destinationAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, payer);
        await createTokenAccount(ctx, payer, destinationAccount, mintAccount, payer);
        await mintTokens(ctx, payer, mintAccount, sourceAccount, payer, 1_000_000);

        const ix = await token2022Client.methods
            .transferChecked({ amount: 400_000, decimals: 9 })
            .accounts({ authority: payer, destination: destinationAccount, mint: mintAccount, source: sourceAccount })
            .instruction();
        ctx.sendInstruction(ix, [payer]);

        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        const destData = decoder.decode(ctx.requireEncodedAccount(destinationAccount).data);
        expect(sourceData.amount).toBe(600_000n);
        expect(destData.amount).toBe(400_000n);
    });
});
