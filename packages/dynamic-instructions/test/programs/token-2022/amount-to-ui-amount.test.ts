import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: amountToUiAmount', () => {
    test('should convert a token amount to its UI representation', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        const amount = 1_000_000_000;
        const expectedUiAmount = amount / 10 ** 9;

        const ix = await token2022Client.methods
            .amountToUiAmount({ amount })
            .accounts({ mint: mintAccount })
            .instruction();

        const meta = ctx.sendInstruction(ix, [payer]);
        const returnData = meta.returnData();
        const uiAmount = new TextDecoder().decode(returnData.data());
        expect(uiAmount).toBe(expectedUiAmount.toString());
    });
});
