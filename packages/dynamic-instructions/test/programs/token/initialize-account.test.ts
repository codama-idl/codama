import { AccountState, getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount } from './token-test-utils';

describe('Token Program: initializeAccount', () => {
    test('should initialize a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();
        const owner = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, tokenAccount, mintAccount, owner);

        const tokenData = getTokenDecoder().decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenData.mint).toBe(mintAccount);
        expect(tokenData.owner).toBe(owner);
        expect(tokenData.amount).toBe(0n);
        expect(tokenData.state).toBe(AccountState.Initialized);
    });
});
