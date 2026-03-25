import { getU64Decoder } from '@solana/codecs';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, TOKEN_2022_ACCOUNT_SIZE, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: getAccountDataSize', () => {
    test('should return the required account size for a given mint', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);

        const ix = await token2022Client.methods.getAccountDataSize().accounts({ mint: mintAccount }).instruction();

        const meta = ctx.sendInstruction(ix, [payer]);
        const size = getU64Decoder().decode(meta.returnData().data());
        expect(size).toBe(BigInt(TOKEN_2022_ACCOUNT_SIZE));
    });
});
