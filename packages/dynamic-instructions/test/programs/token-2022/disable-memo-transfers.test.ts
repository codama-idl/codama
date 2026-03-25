import { some } from '@solana/codecs';
import { getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: disableMemoTransfers', () => {
    test('should enable/disable memo transfers on a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const tokenAccount = ctx.createAccount();

        await createMint(ctx, payer, mint, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mint, payer);

        const reallocateIx = await token2022Client.methods
            .reallocate({ newExtensionTypes: ['memoTransfer'] })
            .accounts({ owner: payer, payer, token: tokenAccount })
            .instruction();

        const enableIx = await token2022Client.methods
            .enableMemoTransfers()
            .accounts({ owner: payer, token: tokenAccount })
            .instruction();

        const disableIx = await token2022Client.methods
            .disableMemoTransfers()
            .accounts({ owner: payer, token: tokenAccount })
            .instruction();

        ctx.sendInstructions([reallocateIx, enableIx], [payer]);

        const tokenDataEnabledMemo = getTokenDecoder().decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenDataEnabledMemo.extensions).toMatchObject(
            some([{ __kind: 'MemoTransfer', requireIncomingTransferMemos: true }]),
        );

        ctx.sendInstructions([reallocateIx, disableIx], [payer]);
        const tokenDataDisabledMemo = getTokenDecoder().decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenDataDisabledMemo.extensions).toMatchObject(
            some([{ __kind: 'MemoTransfer', requireIncomingTransferMemos: false }]),
        );
    });
});
