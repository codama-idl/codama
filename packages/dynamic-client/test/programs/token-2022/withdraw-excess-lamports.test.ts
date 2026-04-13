import { getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: withdrawExcessLamports', () => {
    test('should withdraw excess lamports from a mint account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const destination = await ctx.createFundedAccount();

        // Create mint WITH MintCloseAuthority (required for withdrawExcessLamports).
        const size = getMintSize([{ __kind: 'MintCloseAuthority', closeAuthority: payer }]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initCloseAuthIx = await token2022Client.methods
            .initializeMintCloseAuthority({ closeAuthority: payer })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, freezeAuthority: null, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initCloseAuthIx, initMintIx], [payer, mint]);

        // Airdrop excess lamports to the mint account.
        ctx.airdropToAddress(mint, 1_000_000n);

        const destBefore = ctx.getBalanceOrZero(destination);
        const ix = await token2022Client.methods
            .withdrawExcessLamports()
            .accounts({ authority: payer, destinationAccount: destination, sourceAccount: mint })
            .instruction();
        await ctx.sendInstruction(ix, [payer]);

        expect(ctx.getBalanceOrZero(destination)).toBeGreaterThan(destBefore);
    });
});
