import { some } from '@solana/codecs';
import { getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: disableCpiGuard', () => {
    test('should enable/disable CPI guard on a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const tokenAccount = ctx.createAccount();

        await createMint(ctx, payer, mint, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mint, payer);

        const reallocateIx = await token2022Client.methods
            .reallocate({ newExtensionTypes: ['cpiGuard'] })
            .accounts({ owner: payer, payer, token: tokenAccount })
            .instruction();

        const enableIx = await token2022Client.methods
            .enableCpiGuard()
            .accounts({ owner: payer, token: tokenAccount })
            .instruction();

        const disableIx = await token2022Client.methods
            .disableCpiGuard()
            .accounts({ owner: payer, token: tokenAccount })
            .instruction();

        ctx.sendInstructions([reallocateIx, enableIx], [payer]);

        const decoder = getTokenDecoder();
        const tokenDataCpiEnabled = decoder.decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenDataCpiEnabled.extensions).toMatchObject(some([{ __kind: 'CpiGuard', lockCpi: true }]));

        ctx.sendInstructions([reallocateIx, disableIx], [payer]);
        const tokenDataCpiDisabled = decoder.decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenDataCpiDisabled.extensions).toMatchObject(some([{ __kind: 'CpiGuard', lockCpi: false }]));
    });
});
