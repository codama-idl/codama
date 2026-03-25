import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

describe('System Program: initializeNonceAccount', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('should initialize a nonce account with specified authority', async () => {
        const payer = ctx.createFundedAccount();
        const nonceAccount = ctx.createAccount();
        const nonceAuthority = ctx.createAccount();

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

        const createdAccount = ctx.requireEncodedAccount(nonceAccount);
        expect(createdAccount.data.length).toBe(nonceAccountSpace);

        const initializeNonceInstruction = await programClient.methods
            .initializeNonceAccount({
                nonceAuthority,
            })
            .accounts({
                nonceAccount,
            })
            .instruction();

        ctx.sendInstruction(initializeNonceInstruction, [payer]);

        const initializedAccount = ctx.requireEncodedAccount(nonceAccount);

        expect(initializedAccount).toMatchObject({
            executable: false,
            lamports: BigInt(fundingLamports),
            owner: programClient.programAddress,
        });
        expect(initializedAccount.data.length).toBe(nonceAccountSpace);
        expect(initializedAccount.data.some(byte => byte !== 0)).toBe(true);
    });

    test('should initialize a nonce account where authority is also the payer', async () => {
        const payerAndAuthority = ctx.createFundedAccount();
        const nonceAccount = ctx.createAccount();

        const nonceAccountSpace = 80;
        const fundingLamports = 5_000_000;

        const createAccountInstruction = await programClient.methods
            .createAccount({
                lamports: fundingLamports,
                programAddress: programClient.programAddress,
                space: nonceAccountSpace,
            })
            .accounts({
                newAccount: nonceAccount,
                payer: payerAndAuthority,
            })
            .instruction();

        ctx.sendInstruction(createAccountInstruction, [payerAndAuthority, nonceAccount]);

        const initializeNonceInstruction = await programClient.methods
            .initializeNonceAccount({
                nonceAuthority: payerAndAuthority,
            })
            .accounts({
                nonceAccount,
            })
            .instruction();

        ctx.sendInstruction(initializeNonceInstruction, [payerAndAuthority]);

        const initializedAccount = ctx.requireEncodedAccount(nonceAccount);

        expect(initializedAccount).toMatchObject({
            executable: false,
            lamports: BigInt(fundingLamports),
            owner: programClient.programAddress,
        });
        expect(initializedAccount.data.length).toBe(nonceAccountSpace);
    });
});
