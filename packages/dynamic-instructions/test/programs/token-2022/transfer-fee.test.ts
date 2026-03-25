import { some } from '@solana/codecs';
import { getMintDecoder, getMintSize, getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    createTokenAccountWithExtensions,
    createTransferFeeMint,
    mintTokens,
    systemClient,
    token2022Client,
} from './token-2022-test-utils';

const TRANSFER_FEE_AMOUNT_EXT = [{ __kind: 'TransferFeeAmount' as const, withheldAmount: 0n }];

describe('Token 2022 Program: transferFee', () => {
    test('should initialize transfer fee config extension [initializeTransferFeeConfig]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const feeAuthority = ctx.createFundedAccount();
        const withdrawAuthority = ctx.createFundedAccount();

        const size = getMintSize([
            {
                __kind: 'TransferFeeConfig',
                newerTransferFee: { epoch: 0n, maximumFee: 1_000_000n, transferFeeBasisPoints: 100 },
                olderTransferFee: { epoch: 0n, maximumFee: 0n, transferFeeBasisPoints: 0 },
                transferFeeConfigAuthority: feeAuthority,
                withdrawWithheldAuthority: withdrawAuthority,
                withheldAmount: 0n,
            },
        ]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initFeeConfigIx = await token2022Client.methods
            .initializeTransferFeeConfig({
                maximumFee: 1_000_000,
                transferFeeBasisPoints: 100,
                transferFeeConfigAuthority: feeAuthority,
                withdrawWithheldAuthority: withdrawAuthority,
            })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, freezeAuthority: null, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions([createAccountIx, initFeeConfigIx, initMintIx], [payer, mint]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.extensions).toMatchObject(
            some([
                {
                    __kind: 'TransferFeeConfig',
                    transferFeeConfigAuthority: feeAuthority,
                    withdrawWithheldAuthority: withdrawAuthority,
                },
            ]),
        );
    });

    test('should transfer tokens with fee [transferCheckedWithFee]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const feeAuthority = ctx.createFundedAccount();
        const withdrawAuthority = ctx.createFundedAccount();

        // Prepare mint and accounts with Transfer fee
        const mint = await createTransferFeeMint(ctx, payer, feeAuthority, withdrawAuthority);
        const source = await createTokenAccountWithExtensions(ctx, payer, mint, payer, TRANSFER_FEE_AMOUNT_EXT);
        const destination = await createTokenAccountWithExtensions(ctx, payer, mint, payer, TRANSFER_FEE_AMOUNT_EXT);

        await mintTokens(ctx, payer, mint, source, payer, 1_000_000);

        // Transfer with fee: 1_000_000 * 100 / 10000 = 10_000 fee
        const amount = 1_000_000;
        const fee = 10_000;
        const transferIx = await token2022Client.methods
            .transferCheckedWithFee({ amount, decimals: 9, fee })
            .accounts({ authority: payer, destination, mint, source })
            .instruction();
        ctx.sendInstruction(transferIx, [payer]);

        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(source).data);
        const destData = decoder.decode(ctx.requireEncodedAccount(destination).data);
        expect(sourceData.amount).toBe(0n);
        expect(destData.amount).toBe(BigInt(amount - fee));
    });

    test('should set new transfer fee [setTransferFee]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const feeAuthority = ctx.createFundedAccount();
        const withdrawAuthority = ctx.createFundedAccount();

        // Prepare mint with Transfer fee
        const mint = await createTransferFeeMint(ctx, payer, feeAuthority, withdrawAuthority);

        const setFeeIx = await token2022Client.methods
            .setTransferFee({ maximumFee: 2_000_000, transferFeeBasisPoints: 200 })
            .accounts({ mint, transferFeeConfigAuthority: feeAuthority })
            .signers(['transferFeeConfigAuthority'])
            .instruction();
        ctx.sendInstruction(setFeeIx, [payer, feeAuthority]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toMatchObject(
            some([
                {
                    __kind: 'TransferFeeConfig',
                    newerTransferFee: { maximumFee: 2_000_000n, transferFeeBasisPoints: 200 },
                },
            ]),
        );
    });
});
