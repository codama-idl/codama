import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

describe('System Program: authorizeNonceAccount', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('should change nonce account authority to a new authority', async () => {
        const payer = await ctx.createFundedAccount();
        const nonceAccount = await ctx.createAccount();
        const originalAuthority = await ctx.createFundedAccount();
        const newAuthority = await ctx.createAccount();

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

        await ctx.sendInstruction(createAccountInstruction, [payer, nonceAccount]);

        const initializeNonceInstruction = await programClient.methods
            .initializeNonceAccount({
                nonceAuthority: originalAuthority,
            })
            .accounts({
                nonceAccount,
            })
            .instruction();

        await ctx.sendInstruction(initializeNonceInstruction, [payer]);

        const initializedAccount = ctx.requireEncodedAccount(nonceAccount);
        expect(initializedAccount).toMatchObject({
            executable: false,
            lamports: BigInt(fundingLamports),
            owner: programClient.programAddress,
        });

        const authorizeNonceInstruction = await programClient.methods
            .authorizeNonceAccount({
                newNonceAuthority: newAuthority,
            })
            .accounts({
                nonceAccount,
                nonceAuthority: originalAuthority,
            })
            .instruction();

        await ctx.sendInstruction(authorizeNonceInstruction, [originalAuthority]);

        const authorizedAccount = ctx.requireEncodedAccount(nonceAccount);
        expect(authorizedAccount).toMatchObject({
            executable: false,
            lamports: BigInt(fundingLamports),
            owner: programClient.programAddress,
        });
        expect(authorizedAccount.data.length).toBe(nonceAccountSpace);
    });

    test('should allow changing authority multiple times', async () => {
        const payer = await ctx.createFundedAccount();
        const nonceAccount = await ctx.createAccount();
        const firstAuthority = await ctx.createFundedAccount();
        const secondAuthority = await ctx.createFundedAccount();
        const thirdAuthority = await ctx.createAccount();

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

        await ctx.sendInstruction(createAccountInstruction, [payer, nonceAccount]);

        const initializeNonceInstruction = await programClient.methods
            .initializeNonceAccount({
                nonceAuthority: firstAuthority,
            })
            .accounts({
                nonceAccount,
            })
            .instruction();

        await ctx.sendInstruction(initializeNonceInstruction, [payer]);

        const authorizeToSecondInstruction = await programClient.methods
            .authorizeNonceAccount({
                newNonceAuthority: secondAuthority,
            })
            .accounts({
                nonceAccount,
                nonceAuthority: firstAuthority,
            })
            .instruction();

        await ctx.sendInstruction(authorizeToSecondInstruction, [firstAuthority]);

        const authorizeToThirdInstruction = await programClient.methods
            .authorizeNonceAccount({
                newNonceAuthority: thirdAuthority,
            })
            .accounts({
                nonceAccount,
                nonceAuthority: secondAuthority,
            })
            .instruction();

        await ctx.sendInstruction(authorizeToThirdInstruction, [secondAuthority]);

        const finalAccount = ctx.requireEncodedAccount(nonceAccount);
        expect(finalAccount).toMatchObject({
            executable: false,
            lamports: BigInt(fundingLamports),
            owner: programClient.programAddress,
        });
        expect(finalAccount.data.length).toBe(nonceAccountSpace);
    });

    test('should work when authority transfers to itself (no-op transfer)', async () => {
        const payer = await ctx.createFundedAccount();
        const nonceAccount = await ctx.createAccount();
        const authority = await ctx.createFundedAccount();

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

        await ctx.sendInstruction(createAccountInstruction, [payer, nonceAccount]);

        const initializeNonceInstruction = await programClient.methods
            .initializeNonceAccount({
                nonceAuthority: authority,
            })
            .accounts({
                nonceAccount,
            })
            .instruction();

        await ctx.sendInstruction(initializeNonceInstruction, [payer]);

        const authorizeInstruction = await programClient.methods
            .authorizeNonceAccount({
                newNonceAuthority: authority,
            })
            .accounts({
                nonceAccount,
                nonceAuthority: authority,
            })
            .instruction();

        await ctx.sendInstruction(authorizeInstruction, [authority]);

        const finalAccount = ctx.requireEncodedAccount(nonceAccount);
        expect(finalAccount).toMatchObject({
            executable: false,
            lamports: BigInt(fundingLamports),
            owner: programClient.programAddress,
        });
    });
});
