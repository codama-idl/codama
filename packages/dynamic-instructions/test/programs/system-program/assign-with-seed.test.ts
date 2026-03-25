import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

describe('System Program: assignWithSeed', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('should assign seed-derived account to system program', async () => {
        const payerAccount = ctx.createFundedAccount();
        const baseAccount = ctx.createFundedAccount();

        const seed = 'wallet';
        const account = await ctx.createAccountWithSeed(baseAccount, seed, programClient.programAddress);

        const createIx = await programClient.methods
            .createAccountWithSeed({
                amount: 5_000_000,
                base: baseAccount,
                programAddress: programClient.programAddress,
                seed,
                space: 32,
            })
            .accounts({
                baseAccount,
                newAccount: account,
                payer: payerAccount,
            })
            .instruction();

        ctx.sendInstruction(createIx, [payerAccount, baseAccount]);

        const assignIx = await programClient.methods
            .assignWithSeed({
                base: baseAccount,
                programAddress: programClient.programAddress,
                seed,
            })
            .accounts({
                account,
                baseAccount,
            })
            .instruction();

        ctx.sendInstruction(assignIx, [baseAccount]);

        expect(ctx.requireEncodedAccount(account)).toMatchObject({
            owner: programClient.programAddress,
        });
    });
});
