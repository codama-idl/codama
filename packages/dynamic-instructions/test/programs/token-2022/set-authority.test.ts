import { getMintDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: setAuthority', () => {
    test('should change the mint authority to a new address', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const newAuthority = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);

        const ix = await token2022Client.methods
            .setAuthority({ authorityType: 'mintTokens', newAuthority })
            .accounts({ owned: mintAccount, owner: payer })
            .instruction();
        ctx.sendInstruction(ix, [payer]);

        const decoder = getMintDecoder();
        const mintData = decoder.decode(ctx.requireEncodedAccount(mintAccount).data);
        expect(mintData.mintAuthority).toStrictEqual({ __option: 'Some', value: newAuthority });
    });
});
