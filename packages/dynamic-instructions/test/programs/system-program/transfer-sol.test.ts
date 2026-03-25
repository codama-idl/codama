import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

describe('System Program: transferSol', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('should transfer SOL from one account to another', async () => {
        const initialSourceBalance = 3_000_000_000;
        const source = ctx.createFundedAccount(BigInt(initialSourceBalance));
        const destination = ctx.createAccount();
        const transferAmount = 1_000_000_000;

        expect(ctx.fetchEncodedAccount(source)).toMatchObject({
            lamports: BigInt(initialSourceBalance),
        });
        expect(ctx.fetchEncodedAccount(destination)).toBeNull();

        const instruction = await programClient.methods
            .transferSol({ amount: transferAmount })
            .accounts({ destination, source })
            .instruction();

        ctx.sendInstruction(instruction, [source]);

        const sourceAccount = ctx.requireEncodedAccount(source);
        expect(sourceAccount.lamports).toBeLessThan(BigInt(initialSourceBalance) - BigInt(transferAmount));
        const destinationAccount = ctx.requireEncodedAccount(destination);
        expect(destinationAccount.lamports).toBe(BigInt(transferAmount));
    });
});
