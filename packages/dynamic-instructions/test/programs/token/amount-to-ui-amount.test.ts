import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, tokenClient } from './token-test-utils';

describe('Token Program: amountToUiAmount', () => {
    test('should convert a token amount to its UI representation', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);

        const ix = await tokenClient.methods
            .amountToUiAmount({ amount: 1_000_000_000 })
            .accounts({ mint: mintAccount })
            .instruction();

        const meta = ctx.sendInstruction(ix, [payer]);
        const returnData = meta.returnData();
        const uiAmount = new TextDecoder().decode(returnData.data());
        expect(uiAmount).toBe('1');
    });
});
