import { getMintDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, TOKEN_2022_MINT_SIZE, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: initializeMint2', () => {
    test('should initialize_mint2', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const freezeAuthority = ctx.createAccount();

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
            .initializeMint2({ decimals: 6, freezeAuthority, mintAuthority: payer })
            .accounts({ mint: mintAccount })
            .instruction();

        ctx.sendInstructions([createAccountIx, initMintIx], [payer, mintAccount]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mintAccount).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.decimals).toBe(6);
        expect(mintData.supply).toBe(0n);
        expect(mintData.freezeAuthority).toEqual({ __option: 'Some', value: freezeAuthority });
    });
});
