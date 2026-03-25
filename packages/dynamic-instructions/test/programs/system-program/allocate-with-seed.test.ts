import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

describe('System Program: allocateWithSeed', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('should allocate space for a seed-derived account', async () => {
        const payerAccount = ctx.createFundedAccount();
        const baseAccount = ctx.createFundedAccount();

        const seed = 'storage';
        const newAccount = await ctx.createAccountWithSeed(baseAccount, seed, programClient.programAddress);

        const fundingLamports = 5_000_000;
        const createIx = await programClient.methods
            .createAccountWithSeed({
                amount: fundingLamports,
                base: baseAccount,
                programAddress: programClient.programAddress,
                seed,
                space: 0,
            })
            .accounts({
                baseAccount,
                newAccount,
                payer: payerAccount,
            })
            .instruction();

        ctx.sendInstruction(createIx, [payerAccount, baseAccount]);

        const space = 96;
        const allocateIx = await programClient.methods
            .allocateWithSeed({
                base: baseAccount,
                programAddress: programClient.programAddress,
                seed,
                space,
            })
            .accounts({
                baseAccount,
                newAccount,
            })
            .instruction();

        ctx.sendInstruction(allocateIx, [baseAccount]);

        const accountAfter = ctx.requireEncodedAccount(newAccount);

        expect(accountAfter).toMatchObject({
            data: new Uint8Array(space),
            owner: programClient.programAddress,
        });
    });
});
