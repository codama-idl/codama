import { getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: initializeMintCloseAuthority', () => {
    test('should initialize mint close authority extension', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const closeAuthority = ctx.createAccount();

        const size = getMintSize([{ __kind: 'MintCloseAuthority', closeAuthority }]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initCloseAuthIx = await token2022Client.methods
            .initializeMintCloseAuthority({ closeAuthority })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, freezeAuthority: null, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions([createAccountIx, initCloseAuthIx, initMintIx], [payer, mint]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.decimals).toBe(9);
        expect(mintData.supply).toBe(0n);
    });
});
