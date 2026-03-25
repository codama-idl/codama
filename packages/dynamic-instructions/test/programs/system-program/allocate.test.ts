import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

describe('System Program: allocate', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('should allocate space for an account', async () => {
        const account = ctx.createFundedAccount();
        const space = 100;

        const accountBefore = ctx.requireEncodedAccount(account);
        expect(accountBefore.data.length).toBe(0);

        const instruction = await programClient.methods
            .allocate({ space })
            .accounts({ newAccount: account })
            .instruction();

        ctx.sendInstruction(instruction, [account]);

        const accountAfter = ctx.requireEncodedAccount(account);

        expect(accountAfter).toMatchObject({
            owner: programClient.programAddress,
        });
        expect(accountAfter.data.length).toBe(space);
        expect(accountAfter.lamports).toBeLessThan(accountBefore.lamports);
        expect(accountAfter.data.every(byte => byte === 0)).toBe(true);
    });
});
