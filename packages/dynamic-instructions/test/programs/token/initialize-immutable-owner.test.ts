import { getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, SPL_TOKEN_ACCOUNT_SIZE, systemClient, tokenClient } from './token-test-utils';

describe('Token Program: initializeImmutableOwner', () => {
    test('should initialize immutable owner on a token account before initializeAccount', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);

        const rent = ctx.getMinimumBalanceForRentExemption(BigInt(SPL_TOKEN_ACCOUNT_SIZE));

        const createAccountIx = await systemClient.methods
            .createAccount({
                lamports: rent,
                programAddress: tokenClient.programAddress,
                space: SPL_TOKEN_ACCOUNT_SIZE,
            })
            .accounts({ newAccount: tokenAccount, payer })
            .instruction();

        const initImmutableOwnerIx = await tokenClient.methods
            .initializeImmutableOwner()
            .accounts({ account: tokenAccount })
            .instruction();

        const initAccountIx = await tokenClient.methods
            .initializeAccount()
            .accounts({ account: tokenAccount, mint: mintAccount, owner: payer })
            .instruction();

        ctx.sendInstructions([createAccountIx, initImmutableOwnerIx, initAccountIx], [payer, tokenAccount]);

        const account = ctx.requireEncodedAccount(tokenAccount);
        const tokenData = getTokenDecoder().decode(account.data);
        expect(tokenData.mint).toBe(mintAccount);
        expect(tokenData.owner).toBe(payer);
    });
});
