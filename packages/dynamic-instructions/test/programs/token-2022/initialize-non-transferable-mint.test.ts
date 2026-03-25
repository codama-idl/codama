import { some } from '@solana/codecs';
import { getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: initializeNonTransferableMint', () => {
    test('should initialize non-transferable mint extension', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();

        const size = getMintSize([{ __kind: 'NonTransferable' }]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initNonTransferableIx = await token2022Client.methods
            .initializeNonTransferableMint()
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions([createAccountIx, initNonTransferableIx, initMintIx], [payer, mint]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.freezeAuthority).toEqual({ __option: 'None' });
        expect(mintData.supply).toBe(0n);
        expect(mintData.extensions).toMatchObject(some([{ __kind: 'NonTransferable' }]));
    });
});
