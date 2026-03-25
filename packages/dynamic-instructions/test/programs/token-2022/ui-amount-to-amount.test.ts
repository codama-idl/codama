import { getU64Decoder } from '@solana/codecs';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: uiAmountToAmount', () => {
    test('should convert a UI amount string to a raw token amount', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        const amount = 1_000_000_000;
        const uiAmount = amount / 10 ** 9;

        const ix = await token2022Client.methods
            .uiAmountToAmount({ uiAmount: uiAmount.toString() })
            .accounts({ mint: mintAccount })
            .instruction();

        const meta = ctx.sendInstruction(ix, [payer]);
        const rawAmount = getU64Decoder().decode(meta.returnData().data());
        expect(rawAmount).toBe(BigInt(amount));
    });
});
