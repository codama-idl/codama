import { AccountState, getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: freezeAccount', () => {
    test('should freeze a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();
        const freezeAuthority = ctx.createFundedAccount();

        await createMint(ctx, payer, mintAccount, payer, freezeAuthority);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, payer);

        const freezeIx = await token2022Client.methods
            .freezeAccount()
            .accounts({ account: tokenAccount, mint: mintAccount, owner: freezeAuthority })
            .instruction();

        ctx.sendInstruction(freezeIx, [freezeAuthority]);

        const account = ctx.requireEncodedAccount(tokenAccount);
        const tokenData = getTokenDecoder().decode(account.data);
        expect(tokenData.state).toBe(AccountState.Frozen);
    });
});
