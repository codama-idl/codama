import { beforeEach, describe, expect, test } from 'vitest';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

/**
 *
 * NOTE: This instruction only works on LEGACY nonce accounts (created before
 * the version field was added). When we create new nonce accounts with
 * initializeNonceAccount, they are already in the CURRENT format, so calling
 * upgradeNonceAccount on them will fail with "InvalidArgument".
 *
 * These tests verify that the instruction can be built correctly, but cannot
 * test the actual upgrade behavior since we cannot easily create legacy nonce
 * accounts in the test environment.
 */
describe('System Program: upgradeNonceAccount', () => {
    const programClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
    });

    test('smoke: should build upgrade nonce account instruction correctly', async () => {
        const nonceAccount = ctx.createAccount();

        const upgradeNonceInstruction = await programClient.methods
            .upgradeNonceAccount()
            .accounts({
                nonceAccount,
            })
            .instruction();

        expect(upgradeNonceInstruction).toBeDefined();
        expect(upgradeNonceInstruction.programAddress).toBe(programClient.programAddress);
        expect(upgradeNonceInstruction.accounts).toBeDefined();
        expect(upgradeNonceInstruction.data).toBeDefined();

        expect(upgradeNonceInstruction.accounts?.length).toBe(1);

        const nonceAccountMeta = upgradeNonceInstruction.accounts?.[0];
        expect(nonceAccountMeta?.address).toBe(nonceAccount);
    });
});
