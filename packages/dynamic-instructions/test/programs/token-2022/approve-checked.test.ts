import { getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, mintTokens, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: approveChecked', () => {
    test('should approve_checked a delegate', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const sourceAccount = ctx.createAccount();
        const delegate = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, payer);
        await mintTokens(ctx, payer, mintAccount, sourceAccount, payer, 1_000_000);

        const ix = await token2022Client.methods
            .approveChecked({ amount: 500_000, decimals: 9 })
            .accounts({ delegate, mint: mintAccount, owner: payer, source: sourceAccount })
            .instruction();
        ctx.sendInstruction(ix, [payer]);

        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        expect(sourceData.delegate).toStrictEqual({ __option: 'Some', value: delegate });
        expect(sourceData.delegatedAmount).toBe(500_000n);
    });
});
