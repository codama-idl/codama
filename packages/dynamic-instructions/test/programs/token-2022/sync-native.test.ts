import { address } from '@solana/addresses';
import { getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, TOKEN_2022_ACCOUNT_SIZE, token2022Client } from './token-2022-test-utils';

const TOKEN_2022_NATIVE_MINT = address('9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP');

describe('Token 2022 Program: syncNative', () => {
    test('should sync a wrapped SOL account amount with its lamport balance', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const wrappedSolAccount = ctx.createAccount();

        // Ensure the Token 2022 native mint exists.
        const createNativeMintIx = await token2022Client.methods
            .createNativeMint()
            .accounts({ nativeMint: TOKEN_2022_NATIVE_MINT, payer, systemProgram: ctx.SYSTEM_PROGRAM_ADDRESS })
            .instruction();
        ctx.sendInstruction(createNativeMintIx, [payer]);

        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(TOKEN_2022_ACCOUNT_SIZE));
        const createAccountIx = await systemClient.methods
            .createAccount({
                lamports,
                programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS,
                space: TOKEN_2022_ACCOUNT_SIZE,
            })
            .accounts({ newAccount: wrappedSolAccount, payer })
            .instruction();

        const initAccountIx = await token2022Client.methods
            .initializeAccount()
            .accounts({ account: wrappedSolAccount, mint: TOKEN_2022_NATIVE_MINT, owner: payer })
            .instruction();

        ctx.sendInstructions([createAccountIx, initAccountIx], [payer, wrappedSolAccount]);

        const transferAmount = 1_000_000_000n;
        const transferIx = await systemClient.methods
            .transferSol({ amount: transferAmount })
            .accounts({ destination: wrappedSolAccount, source: payer })
            .instruction();
        ctx.sendInstruction(transferIx, [payer]);

        const decoder = getTokenDecoder();
        const beforeSync = decoder.decode(ctx.requireEncodedAccount(wrappedSolAccount).data);
        expect(beforeSync.amount).toBe(0n);

        const syncIx = await token2022Client.methods
            .syncNative()
            .accounts({ account: wrappedSolAccount })
            .instruction();
        ctx.sendInstruction(syncIx, [payer]);

        const afterSync = decoder.decode(ctx.requireEncodedAccount(wrappedSolAccount).data);
        expect(afterSync.amount).toBe(transferAmount);
    });
});
