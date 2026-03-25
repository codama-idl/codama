import { getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, mintTokens, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: revoke', () => {
    test('should revoke a delegate from a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const sourceAccount = ctx.createAccount();
        const delegate = ctx.createAccount();
        const decoder = getTokenDecoder();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, payer);
        await mintTokens(ctx, payer, mintAccount, sourceAccount, payer, 1_000_000);

        const approveIx = await token2022Client.methods
            .approve({ amount: 500_000 })
            .accounts({ delegate, owner: payer, source: sourceAccount })
            .instruction();
        ctx.sendInstruction(approveIx, [payer]);

        const sourceDataBefore = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        expect(sourceDataBefore.delegate).toStrictEqual({ __option: 'Some', value: delegate });
        expect(sourceDataBefore.delegatedAmount).toBe(500_000n);

        const ix = await token2022Client.methods
            .revoke()
            .accounts({ owner: payer, source: sourceAccount })
            .instruction();
        ctx.sendInstruction(ix, [payer]);

        const sourceDataAfter = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        expect(sourceDataAfter.delegate).toStrictEqual({ __option: 'None' });
        expect(sourceDataAfter.delegatedAmount).toBe(0n);
    });
});
