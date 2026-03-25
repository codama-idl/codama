import { getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    createTokenAccountWithExtensions,
    createTransferFeeMint,
    mintTokens,
    token2022Client,
} from './token-2022-test-utils';

const TRANSFER_FEE_AMOUNT_EXT = [{ __kind: 'TransferFeeAmount' as const, withheldAmount: 0n }];

describe('Token 2022 Program: withdrawWithheldTokens', () => {
    test('should withdraw withheld tokens from mint', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const feeAuthority = ctx.createFundedAccount();
        const withdrawAuthority = ctx.createFundedAccount();

        // Prepare mint with Transfer fee
        const mint = await createTransferFeeMint(ctx, payer, feeAuthority, withdrawAuthority);
        const source = await createTokenAccountWithExtensions(ctx, payer, mint, payer, TRANSFER_FEE_AMOUNT_EXT);
        const destination = await createTokenAccountWithExtensions(ctx, payer, mint, payer, TRANSFER_FEE_AMOUNT_EXT);
        const feeReceiver = await createTokenAccountWithExtensions(ctx, payer, mint, payer, TRANSFER_FEE_AMOUNT_EXT);

        // Mint and transfer to generate fees
        await mintTokens(ctx, payer, mint, source, payer, 1_000_000);

        const transferIx = await token2022Client.methods
            .transferCheckedWithFee({ amount: 1_000_000, decimals: 9, fee: 10_000 })
            .accounts({ authority: payer, destination, mint, source })
            .instruction();
        ctx.sendInstruction(transferIx, [payer]);

        // Harvest fees from destination to mint
        const harvestIx = await token2022Client.methods
            .harvestWithheldTokensToMint({ sources: [destination] })
            .accounts({ mint })
            .instruction();
        ctx.sendInstruction(harvestIx, [payer]);

        // Withdraw from mint to feeReceiver
        const withdrawIx = await token2022Client.methods
            .withdrawWithheldTokensFromMint()
            .accounts({ feeReceiver, mint, withdrawWithheldAuthority: withdrawAuthority })
            .signers(['withdrawWithheldAuthority'])
            .instruction();
        ctx.sendInstruction(withdrawIx, [payer, withdrawAuthority]);

        const feeReceiverData = getTokenDecoder().decode(ctx.requireEncodedAccount(feeReceiver).data);
        expect(feeReceiverData.amount).toBe(10_000n);
    });

    test('should withdraw withheld tokens from accounts', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const feeAuthority = ctx.createFundedAccount();
        const withdrawAuthority = ctx.createFundedAccount();

        // Prepare mint and accounts with Transfer fee
        const mint = await createTransferFeeMint(ctx, payer, feeAuthority, withdrawAuthority);
        const source = await createTokenAccountWithExtensions(ctx, payer, mint, payer, TRANSFER_FEE_AMOUNT_EXT);
        const destination = await createTokenAccountWithExtensions(ctx, payer, mint, payer, TRANSFER_FEE_AMOUNT_EXT);
        const feeReceiver = await createTokenAccountWithExtensions(ctx, payer, mint, payer, TRANSFER_FEE_AMOUNT_EXT);

        // Mint and transfer to generate fees
        await mintTokens(ctx, payer, mint, source, payer, 1_000_000);

        const transferIx = await token2022Client.methods
            .transferCheckedWithFee({ amount: 1_000_000, decimals: 9, fee: 10_000 })
            .accounts({ authority: payer, destination, mint, source })
            .instruction();
        ctx.sendInstruction(transferIx, [payer]);

        // Withdraw directly from accounts
        const withdrawIx = await token2022Client.methods
            .withdrawWithheldTokensFromAccounts({ numTokenAccounts: 1, sources: [destination] })
            .accounts({ feeReceiver, mint, withdrawWithheldAuthority: withdrawAuthority })
            .signers(['withdrawWithheldAuthority'])
            .instruction();
        ctx.sendInstruction(withdrawIx, [payer, withdrawAuthority]);

        const feeReceiverData = getTokenDecoder().decode(ctx.requireEncodedAccount(feeReceiver).data);
        expect(feeReceiverData.amount).toBe(10_000n);
    });
});
