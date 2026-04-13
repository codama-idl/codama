import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

describe('System Program: assign', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('should assign a new owner to an account', async () => {
        const payer = await ctx.createFundedAccount();
        const accountToAssign = await ctx.createAccount();
        const newOwner = await ctx.createAccount();
        const amount = 1_000_000;

        const transferInstruction = await programClient.methods
            .transferSol({ amount })
            .accounts({
                destination: accountToAssign,
                source: payer,
            })
            .instruction();

        const assignInstruction = await programClient.methods
            .assign({ programAddress: newOwner })
            .accounts({ account: accountToAssign })
            .instruction();

        await ctx.sendInstructions([transferInstruction, assignInstruction], [payer, accountToAssign]);

        expect(ctx.requireEncodedAccount(accountToAssign)).toMatchObject({
            lamports: BigInt(amount),
            owner: newOwner,
        });
    });

    test('should assign account to system program', async () => {
        const account = await ctx.createFundedAccount();

        const instruction = await programClient.methods
            .assign({ programAddress: programClient.programAddress })
            .accounts({ account: account })
            .instruction();

        await ctx.sendInstruction(instruction, [account]);

        const encodedAccount = ctx.requireEncodedAccount(account);
        expect(encodedAccount).toMatchObject({
            owner: programClient.programAddress,
        });
    });
});
