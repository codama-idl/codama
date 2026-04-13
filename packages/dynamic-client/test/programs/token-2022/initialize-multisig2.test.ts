import { getMultisigDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, TOKEN_2022_MULTISIG_SIZE, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: initializeMultisig2', () => {
    test('should initialize_multisig2 account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const multisigAccount = await ctx.createAccount();

        const signer1 = await ctx.createAccount();
        const signer2 = await ctx.createAccount();
        const signer3 = await ctx.createAccount();

        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(TOKEN_2022_MULTISIG_SIZE));
        const createAccountIx = await systemClient.methods
            .createAccount({
                lamports,
                programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS,
                space: TOKEN_2022_MULTISIG_SIZE,
            })
            .accounts({ newAccount: multisigAccount, payer })
            .instruction();

        const initMultisigIx = await token2022Client.methods
            .initializeMultisig2({ m: 2, signers: [signer1, signer2, signer3] })
            .accounts({ multisig: multisigAccount })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initMultisigIx], [payer, multisigAccount]);

        const decoder = getMultisigDecoder();
        const multisigData = decoder.decode(ctx.requireEncodedAccount(multisigAccount).data);
        expect(multisigData.m).toBe(2);
        expect(multisigData.n).toBe(3);
        expect(multisigData.isInitialized).toBe(true);
        expect(multisigData.signers.slice(0, 3)).toStrictEqual([signer1, signer2, signer3]);
    });
});
