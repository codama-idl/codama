import { some } from '@solana/codecs';
import { getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: scaledUiAmount', () => {
    test('should update multiplier for scaled UI amount [initializeScaledUiAmountMint + updateMultiplierScaledUiMint]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();

        const size = getMintSize([
            {
                __kind: 'ScaledUiAmountConfig',
                authority: payer,
                multiplier: 1.0,
                newMultiplier: 0,
                newMultiplierEffectiveTimestamp: 0n,
            },
        ]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initScaledIx = await token2022Client.methods
            .initializeScaledUiAmountMint({ authority: payer, multiplier: 1.0 })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions([createAccountIx, initScaledIx, initMintIx], [payer, mint]);

        const updateIx = await token2022Client.methods
            .updateMultiplierScaledUiMint({ effectiveTimestamp: 0, multiplier: 2.5 })
            .accounts({ authority: payer, mint })
            .instruction();
        ctx.sendInstruction(updateIx, [payer]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toMatchObject(some([{ __kind: 'ScaledUiAmountConfig', newMultiplier: 2.5 }]));
    });
});
