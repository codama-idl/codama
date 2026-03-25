import { getMintDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, TOKEN_2022_MINT_SIZE, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: initializeMint', () => {
    test('should initialize a mint with default freeze authority (None)', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();

        const mintRent = ctx.getMinimumBalanceForRentExemption(BigInt(TOKEN_2022_MINT_SIZE));

        const createAccountIx = await systemClient.methods
            .createAccount({
                lamports: mintRent,
                programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS,
                space: TOKEN_2022_MINT_SIZE,
            })
            .accounts({
                newAccount: mintAccount,
                payer,
            })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint({ decimals: 9, mintAuthority: payer })
            .accounts({ mint: mintAccount })
            .instruction();

        ctx.sendInstructions([createAccountIx, initMintIx], [payer, mintAccount]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mintAccount).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.decimals).toBe(9);
        expect(mintData.supply).toBe(0n);
        expect(mintData.freezeAuthority).toEqual({ __option: 'None' });
    });
});
