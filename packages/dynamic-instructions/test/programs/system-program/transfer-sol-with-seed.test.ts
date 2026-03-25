import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

describe('System Program: transferSolWithSeed', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('should transfer SOL from a seed-derived account to a destination', async () => {
        const payerAccount = ctx.createFundedAccount();
        const baseAccount = ctx.createFundedAccount();

        const seed = 'vault';
        const source = await ctx.createAccountWithSeed(baseAccount, seed, programClient.programAddress);

        const fundingLamports = 10_000_000;
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
                newAccount: source,
                payer: payerAccount,
            })
            .instruction();

        ctx.sendInstruction(createIx, [payerAccount, baseAccount]);

        const destination = ctx.createAccount();
        const transferAmount = 3_000_000;

        expect(ctx.requireEncodedAccount(source).lamports).toBe(BigInt(fundingLamports));
        expect(ctx.fetchEncodedAccount(destination)).toBeNull();

        const transferIx = await programClient.methods
            .transferSolWithSeed({
                amount: transferAmount,
                fromOwner: programClient.programAddress,
                fromSeed: seed,
            })
            .accounts({
                baseAccount,
                destination,
                source,
            })
            .instruction();

        ctx.sendInstruction(transferIx, [baseAccount]);

        const sourceAfter = ctx.requireEncodedAccount(source);
        const destinationAfter = ctx.requireEncodedAccount(destination);

        expect(sourceAfter.lamports).toBe(BigInt(fundingLamports) - BigInt(transferAmount));
        expect(destinationAfter.lamports).toBe(BigInt(transferAmount));
    });
});
