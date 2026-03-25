import { getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, tokenClient } from './token-test-utils';

describe('Token Program: revoke', () => {
    test('should revoke a delegate from a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const sourceAccount = ctx.createAccount();
        const delegate = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, payer);

        const mintIx = await tokenClient.methods
            .mintTo({ amount: 1_000_000 })
            .accounts({ mint: mintAccount, mintAuthority: payer, token: sourceAccount })
            .instruction();
        ctx.sendInstruction(mintIx, [payer]);

        const approveIx = await tokenClient.methods
            .approve({ amount: 500_000 })
            .accounts({ delegate, owner: payer, source: sourceAccount })
            .instruction();
        ctx.sendInstruction(approveIx, [payer]);

        const ix = await tokenClient.methods.revoke().accounts({ owner: payer, source: sourceAccount }).instruction();
        ctx.sendInstruction(ix, [payer]);

        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        expect(sourceData.delegate).toStrictEqual({ __option: 'None' });
        expect(sourceData.delegatedAmount).toBe(0n);
    });
});
