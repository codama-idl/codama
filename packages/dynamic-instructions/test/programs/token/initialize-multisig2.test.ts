import { getMultisigDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { SPL_TOKEN_MULTISIG_SIZE, systemClient, tokenClient } from './token-test-utils';

describe('Token Program: initializeMultisig2', () => {
    test('should initialize a multisig account without requiring the Rent sysvar', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const multisigAccount = ctx.createAccount();

        const signer1 = ctx.createAccount();
        const signer2 = ctx.createAccount();
        const signer3 = ctx.createAccount();

        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(SPL_TOKEN_MULTISIG_SIZE));
        const createAccountIx = await systemClient.methods
            .createAccount({
                lamports,
                programAddress: tokenClient.programAddress,
                space: SPL_TOKEN_MULTISIG_SIZE,
            })
            .accounts({ newAccount: multisigAccount, payer })
            .instruction();

        const initMultisigIx = await tokenClient.methods
            .initializeMultisig2({ m: 2, signers: [signer1, signer2, signer3] })
            .accounts({ multisig: multisigAccount })
            .instruction();

        ctx.sendInstructions([createAccountIx, initMultisigIx], [payer, multisigAccount]);

        const decoder = getMultisigDecoder();
        const multisigData = decoder.decode(ctx.requireEncodedAccount(multisigAccount).data);
        expect(multisigData.m).toBe(2);
        expect(multisigData.n).toBe(3);
        expect(multisigData.isInitialized).toBe(true);
        expect(multisigData.signers.slice(0, 3)).toStrictEqual([signer1, signer2, signer3]);
    });
});
