import { getMintDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, tokenClient } from './token-test-utils';

describe('Token Program: setAuthority', () => {
    test('should change the mint authority to a new address', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mintAccount = await ctx.createAccount();
        const newAuthority = await ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);

        const ix = await tokenClient.methods
            .setAuthority({ authorityType: 'mintTokens', newAuthority })
            .accounts({ owned: mintAccount, owner: payer })
            .instruction();
        await ctx.sendInstruction(ix, [payer]);

        const decoder = getMintDecoder();
        const mintData = decoder.decode(ctx.requireEncodedAccount(mintAccount).data);
        expect(mintData.mintAuthority).toStrictEqual({ __option: 'Some', value: newAuthority });
    });
});
