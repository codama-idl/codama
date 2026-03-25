import type { Address } from '@solana/addresses';
import { some } from '@solana/codecs';
import { type ExtensionArgs, getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

const getConfidentialTransferFeeExts = (
    feeAuthority: Address,
    withdrawAuthority: Address,
    confidentialFeeAuthority: Address,
    confidentialTransferAuthority: Address,
    elgamalPubkey: Address,
): ExtensionArgs[] => [
    {
        __kind: 'TransferFeeConfig',
        newerTransferFee: { epoch: 0n, maximumFee: 1_000_000n, transferFeeBasisPoints: 100 },
        olderTransferFee: { epoch: 0n, maximumFee: 0n, transferFeeBasisPoints: 0 },
        transferFeeConfigAuthority: feeAuthority,
        withdrawWithheldAuthority: withdrawAuthority,
        withheldAmount: 0n,
    },
    {
        __kind: 'ConfidentialTransferMint',
        auditorElgamalPubkey: null,
        authority: confidentialTransferAuthority,
        autoApproveNewAccounts: true,
    },
    {
        __kind: 'ConfidentialTransferFee',
        authority: confidentialFeeAuthority,
        elgamalPubkey: elgamalPubkey,
        harvestToMintEnabled: true,
        withheldAmount: new Uint8Array(64),
    },
];

describe('Token 2022 Program: confidentialTransferFee', () => {
    test('should initialize confidential transfer fee extension [initializeConfidentialTransferFee]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const feeAuthority = ctx.createFundedAccount();
        const withdrawAuthority = ctx.createFundedAccount();
        const confidentialFeeAuthority = ctx.createFundedAccount();
        const confidentialTransferAuthority = ctx.createFundedAccount();
        const elgamalPubkey = ctx.createFundedAccount();

        const size = getMintSize(
            getConfidentialTransferFeeExts(
                feeAuthority,
                withdrawAuthority,
                confidentialFeeAuthority,
                confidentialTransferAuthority,
                elgamalPubkey,
            ),
        );
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

        const initConfidentialTransferIx = await token2022Client.methods
            .initializeConfidentialTransferMint({
                auditorElgamalPubkey: null,
                authority: confidentialTransferAuthority,
                autoApproveNewAccounts: true,
            })
            .accounts({ mint })
            .instruction();

        const initConfidentialFeeIx = await token2022Client.methods
            .initializeConfidentialTransferFee({
                authority: confidentialFeeAuthority,
                withdrawWithheldAuthorityElGamalPubkey: elgamalPubkey,
            })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions(
            [createAccountIx, initFeeConfigIx, initConfidentialTransferIx, initConfidentialFeeIx, initMintIx],
            [payer, mint],
        );

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.extensions).toEqual(
            some([
                {
                    __kind: 'TransferFeeConfig',
                    newerTransferFee: { epoch: 0n, maximumFee: 1_000_000n, transferFeeBasisPoints: 100 },
                    olderTransferFee: { epoch: 0n, maximumFee: 1_000_000n, transferFeeBasisPoints: 100 },
                    transferFeeConfigAuthority: feeAuthority,
                    withdrawWithheldAuthority: withdrawAuthority,
                    withheldAmount: 0n,
                },
                {
                    __kind: 'ConfidentialTransferMint',
                    auditorElgamalPubkey: { __option: 'None' },
                    authority: { __option: 'Some', value: confidentialTransferAuthority },
                    autoApproveNewAccounts: true,
                },
                {
                    __kind: 'ConfidentialTransferFee',
                    authority: { __option: 'Some', value: confidentialFeeAuthority },
                    elgamalPubkey,
                    harvestToMintEnabled: true,
                    withheldAmount: Uint8Array.from({ length: 64 }, () => 0),
                },
            ]),
        );
    });
});
