import { getMintDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { SPL_TOKEN_MINT_SIZE, systemClient, tokenClient } from './token-test-utils';

describe('Token Program: initializeMint2', () => {
    test('should initialize a mint without requiring the Rent sysvar', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const freezeAuthority = ctx.createAccount();

        const mintRent = ctx.getMinimumBalanceForRentExemption(BigInt(SPL_TOKEN_MINT_SIZE));

        const createAccountIx = await systemClient.methods
            .createAccount({
                lamports: mintRent,
                programAddress: tokenClient.programAddress,
                space: SPL_TOKEN_MINT_SIZE,
            })
            .accounts({
                newAccount: mintAccount,
                payer,
            })
            .instruction();

        const initMintIx = await tokenClient.methods
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
