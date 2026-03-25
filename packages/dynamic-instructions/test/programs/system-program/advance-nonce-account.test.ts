import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

describe('System Program: advanceNonceAccount', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('should advance nonce multiple times and work after authority change', async () => {
        const payer = ctx.createFundedAccount();
        const nonceAccount = ctx.createAccount();
        const originalAuthority = ctx.createFundedAccount();
        const newAuthority = ctx.createFundedAccount();

        const nonceAccountSpace = 80;
        const fundingLamports = 10_000_000;

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
                nonceAuthority: originalAuthority,
            })
            .accounts({
                nonceAccount,
            })
            .instruction();

        ctx.sendInstruction(initializeNonceInstruction, [payer]);

        const initialData = ctx.requireEncodedAccount(nonceAccount).data;

        ctx.advanceSlots();
        const advanceNonceInstruction1 = await programClient.methods
            .advanceNonceAccount()
            .accounts({
                nonceAccount,
                nonceAuthority: originalAuthority,
            })
            .instruction();

        ctx.sendInstruction(advanceNonceInstruction1, [originalAuthority]);

        const dataAfterFirstAdvance = ctx.requireEncodedAccount(nonceAccount).data;
        expect(dataAfterFirstAdvance).not.toEqual(initialData);

        ctx.advanceSlots();
        const advanceNonceInstruction2 = await programClient.methods
            .advanceNonceAccount()
            .accounts({
                nonceAccount,
                nonceAuthority: originalAuthority,
            })
            .instruction();

        ctx.sendInstruction(advanceNonceInstruction2, [originalAuthority]);

        const dataAfterSecondAdvance = ctx.requireEncodedAccount(nonceAccount).data;
        expect(dataAfterSecondAdvance).not.toEqual(dataAfterFirstAdvance);

        const authorizeNonceInstruction = await programClient.methods
            .authorizeNonceAccount({
                newNonceAuthority: newAuthority,
            })
            .accounts({
                nonceAccount,
                nonceAuthority: originalAuthority,
            })
            .instruction();

        ctx.sendInstruction(authorizeNonceInstruction, [originalAuthority]);

        ctx.advanceSlots();
        const advanceWithNewAuthority = await programClient.methods
            .advanceNonceAccount()
            .accounts({
                nonceAccount,
                nonceAuthority: newAuthority,
            })
            .instruction();

        ctx.sendInstruction(advanceWithNewAuthority, [newAuthority]);

        const finalAccount = ctx.requireEncodedAccount(nonceAccount);
        expect(finalAccount).toMatchObject({
            executable: false,
            lamports: BigInt(fundingLamports),
            owner: programClient.programAddress,
        });
        expect(finalAccount.data.length).toBe(nonceAccountSpace);
    });
});
