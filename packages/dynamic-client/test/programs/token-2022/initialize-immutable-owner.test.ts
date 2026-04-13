import { some } from '@solana/codecs';
import { getTokenDecoder, getTokenSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, systemClient, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: initializeImmutableOwner', () => {
    test('should initialize immutable owner extension on a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const tokenAccount = await ctx.createAccount();
        const owner = await ctx.createFundedAccount();

        await createMint(ctx, payer, mint, payer);

        const space = getTokenSize([{ __kind: 'ImmutableOwner' }]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(space));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space })
            .accounts({ newAccount: tokenAccount, payer })
            .instruction();

        const initImmutableOwnerIx = await token2022Client.methods
            .initializeImmutableOwner()
            .accounts({ account: tokenAccount })
            .instruction();

        const initAccountIx = await token2022Client.methods
            .initializeAccount3({ owner })
            .accounts({ account: tokenAccount, mint })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initImmutableOwnerIx, initAccountIx], [payer, tokenAccount]);

        const tokenData = getTokenDecoder().decode(ctx.requireEncodedAccount(tokenAccount).data);
        expect(tokenData.mint).toBe(mint);
        expect(tokenData.owner).toBe(owner);
        expect(tokenData.extensions).toMatchObject(some([{ __kind: 'ImmutableOwner' }]));
    });
});
