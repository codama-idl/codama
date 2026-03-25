import { AccountState, getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, tokenClient } from './token-test-utils';

describe('Token Program: freezeAccount', () => {
    test('should freeze a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();
        const freezeAuthority = ctx.createFundedAccount();

        await createMint(ctx, payer, mintAccount, payer, freezeAuthority);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, payer);

        const freezeIx = await tokenClient.methods
            .freezeAccount()
            .accounts({ account: tokenAccount, mint: mintAccount, owner: freezeAuthority })
            .instruction();

        ctx.sendInstruction(freezeIx, [freezeAuthority]);

        const account = ctx.requireEncodedAccount(tokenAccount);
        const tokenData = getTokenDecoder().decode(account.data);
        expect(tokenData.state).toBe(AccountState.Frozen);
    });
});
