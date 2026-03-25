import { getU64Decoder } from '@solana/codecs';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, SPL_TOKEN_ACCOUNT_SIZE, tokenClient } from './token-test-utils';

describe('Token Program: getAccountDataSize', () => {
    test('should return the required account size for a given mint', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);

        const ix = await tokenClient.methods.getAccountDataSize().accounts({ mint: mintAccount }).instruction();

        const meta = ctx.sendInstruction(ix, [payer]);
        const size = getU64Decoder().decode(meta.returnData().data());
        expect(size).toBe(BigInt(SPL_TOKEN_ACCOUNT_SIZE));
    });
});
