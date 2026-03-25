import { address } from '@solana/addresses';
import { getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { SPL_TOKEN_ACCOUNT_SIZE, systemClient, tokenClient } from './token-test-utils';

const NATIVE_MINT = address('So11111111111111111111111111111111111111112');

describe('Token Program: syncNative', () => {
    test('should sync a wrapped SOL account amount with its lamport balance', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const wrappedSolAccount = ctx.createAccount();

        // Create and initialize a wrapped SOL token account.
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(SPL_TOKEN_ACCOUNT_SIZE));
        const createAccountIx = await systemClient.methods
            .createAccount({
                lamports,
                programAddress: tokenClient.programAddress,
                space: SPL_TOKEN_ACCOUNT_SIZE,
            })
            .accounts({ newAccount: wrappedSolAccount, payer })
            .instruction();

        const initAccountIx = await tokenClient.methods
            .initializeAccount()
            .accounts({ account: wrappedSolAccount, mint: NATIVE_MINT, owner: payer })
            .instruction();

        ctx.sendInstructions([createAccountIx, initAccountIx], [payer, wrappedSolAccount]);

        // Transfer additional SOL to the wrapped account via system program.
        const transferAmount = 1_000_000_000n;
        const transferIx = await systemClient.methods
            .transferSol({ amount: transferAmount })
            .accounts({ destination: wrappedSolAccount, source: payer })
            .instruction();
        ctx.sendInstruction(transferIx, [payer]);

        // Token amount is still 0 before sync.
        const decoder = getTokenDecoder();
        const beforeSync = decoder.decode(ctx.requireEncodedAccount(wrappedSolAccount).data);
        expect(beforeSync.amount).toBe(0n);

        // Sync native to update the token amount.
        const syncIx = await tokenClient.methods.syncNative().accounts({ account: wrappedSolAccount }).instruction();
        ctx.sendInstruction(syncIx, [payer]);

        const afterSync = decoder.decode(ctx.requireEncodedAccount(wrappedSolAccount).data);
        expect(afterSync.amount).toBe(transferAmount);
    });
});
