import { AccountState, getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, SPL_TOKEN_ACCOUNT_SIZE, systemClient, tokenClient } from './token-test-utils';

describe('Token Program: initializeAccount3', () => {
    test('should initialize a token account without requiring the Rent sysvar', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();
        const owner = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);

        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(SPL_TOKEN_ACCOUNT_SIZE));
        const createAccountIx = await systemClient.methods
            .createAccount({
                lamports,
                programAddress: tokenClient.programAddress,
                space: SPL_TOKEN_ACCOUNT_SIZE,
            })
            .accounts({ newAccount: tokenAccount, payer })
            .instruction();

        const initAccountIx = await tokenClient.methods
            .initializeAccount3({ owner })
            .accounts({ account: tokenAccount, mint: mintAccount })
            .instruction();

        ctx.sendInstructions([createAccountIx, initAccountIx], [payer, tokenAccount]);

        const decoder = getTokenDecoder();
        const tokenData = decoder.decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenData.mint).toBe(mintAccount);
        expect(tokenData.owner).toBe(owner);
        expect(tokenData.state).toBe(AccountState.Initialized);
    });
});
