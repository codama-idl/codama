import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

describe('System Program: withdrawNonceAccount', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('should withdraw lamports from nonce account to recipient', async () => {
        const payer = ctx.createFundedAccount();
        const nonceAccount = ctx.createAccount();
        const nonceAuthority = ctx.createFundedAccount();
        const recipient = ctx.createAccount();

        const nonceAccountSpace = 80;
        const fundingLamports = 10_000_000;
        const withdrawAmount = 2_000_000;

        const createAccountInstruction = await programClient.methods
            .createAccount({
                lamports: fundingLamports,
                programAddress: programClient.programAddress,
                space: nonceAccountSpace,
            })
            .accounts({
                newAccount: nonceAccount,
                payer,
            })
            .instruction();

        ctx.sendInstruction(createAccountInstruction, [payer, nonceAccount]);

        const initializeNonceInstruction = await programClient.methods
            .initializeNonceAccount({
                nonceAuthority,
            })
            .accounts({
                nonceAccount,
            })
            .instruction();

        ctx.sendInstruction(initializeNonceInstruction, [payer]);

        const beforeWithdraw = ctx.requireEncodedAccount(nonceAccount);
        expect(beforeWithdraw.lamports).toBe(BigInt(fundingLamports));

        const withdrawInstruction = await programClient.methods
            .withdrawNonceAccount({
                withdrawAmount,
            })
            .accounts({
                nonceAccount,
                nonceAuthority,
                recipientAccount: recipient,
            })
            .instruction();

        ctx.sendInstruction(withdrawInstruction, [nonceAuthority]);

        const afterWithdrawNonce = ctx.requireEncodedAccount(nonceAccount);
        expect(afterWithdrawNonce.lamports).toBe(BigInt(fundingLamports - withdrawAmount));

        const recipientAccount = ctx.requireEncodedAccount(recipient);
        expect(recipientAccount.lamports).toBe(BigInt(withdrawAmount));
    });
});
