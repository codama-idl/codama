import { getU64Decoder } from '@solana/codecs';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, tokenClient } from './token-test-utils';

describe('Token Program: uiAmountToAmount', () => {
    test('should convert a UI amount string to a raw token amount', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);

        const ix = await tokenClient.methods
            .uiAmountToAmount({ uiAmount: '1' })
            .accounts({ mint: mintAccount })
            .instruction();

        const meta = ctx.sendInstruction(ix, [payer]);
        const rawAmount = getU64Decoder().decode(meta.returnData().data());
        expect(rawAmount).toBe(1_000_000_000n);
    });
});
