import { some } from '@solana/codecs';
import { getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: initializeInterestBearingMint', () => {
    test('should initialize interest bearing mint extension', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const rateAuthority = ctx.createFundedAccount();
        const freezeAuthority = ctx.createFundedAccount();

        const size = getMintSize([
            {
                __kind: 'InterestBearingConfig',
                currentRate: 500,
                initializationTimestamp: 0n,
                lastUpdateTimestamp: 0n,
                preUpdateAverageRate: 0,
                rateAuthority,
            },
        ]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initInterestBearingIx = await token2022Client.methods
            .initializeInterestBearingMint({ rate: 500, rateAuthority })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, freezeAuthority: freezeAuthority, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions([createAccountIx, initInterestBearingIx, initMintIx], [payer, mint]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.freezeAuthority).toEqual({ __option: 'Some', value: freezeAuthority });
        expect(mintData.extensions).toMatchObject(
            some([{ __kind: 'InterestBearingConfig', currentRate: 500, rateAuthority }]),
        );
    });
});
