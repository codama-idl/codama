import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: createNativeMint', () => {
    test('should create the Token 2022 native mint', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();

        const ix = await token2022Client.methods
            .createNativeMint()
            .accounts({ nativeMint: ctx.TOKEN_2022_NATIVE_MINT, payer })
            .instruction();
        ctx.sendInstruction(ix, [payer]);

        const account = ctx.fetchEncodedAccount(ctx.TOKEN_2022_NATIVE_MINT);
        expect(account).not.toBeNull();
    });
});
