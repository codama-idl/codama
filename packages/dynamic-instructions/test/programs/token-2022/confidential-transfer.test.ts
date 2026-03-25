import type { Address } from '@solana/addresses';
import { none, some } from '@solana/codecs';
import { type Extension, type ExtensionArgs, getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

const getConfidentialTransferMintExt = (authority: Address): ExtensionArgs[] => [
    {
        __kind: 'ConfidentialTransferMint',
        auditorElgamalPubkey: null,
        authority,
        autoApproveNewAccounts: true,
    },
];

describe('Token 2022 Program: confidentialTransfer', () => {
    test('should initialize confidential transfer mint extension [initializeConfidentialTransferMint]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const confidentialTransferAuthority = ctx.createFundedAccount();

        const size = getMintSize(getConfidentialTransferMintExt(confidentialTransferAuthority));
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initConfidentialTransferIx = await token2022Client.methods
            .initializeConfidentialTransferMint({
                auditorElgamalPubkey: null,
                authority: confidentialTransferAuthority,
                autoApproveNewAccounts: true,
            })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions([createAccountIx, initConfidentialTransferIx, initMintIx], [payer, mint]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                {
                    __kind: 'ConfidentialTransferMint',
                    auditorElgamalPubkey: none(),
                    authority: some(confidentialTransferAuthority),
                    autoApproveNewAccounts: true,
                },
            ]),
        );
    });

    test('should update confidential transfer mint config [updateConfidentialTransferMint]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const confidentialTransferAuthority = ctx.createFundedAccount();
        const auditorElgamalPubkey = ctx.createFundedAccount();

        const size = getMintSize(getConfidentialTransferMintExt(confidentialTransferAuthority));
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initConfidentialTransferIx = await token2022Client.methods
            .initializeConfidentialTransferMint({
                auditorElgamalPubkey,
                authority: confidentialTransferAuthority,
                autoApproveNewAccounts: true,
            })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions([createAccountIx, initConfidentialTransferIx, initMintIx], [payer, mint]);

        const updateIx = await token2022Client.methods
            .updateConfidentialTransferMint({ auditorElgamalPubkey: null, autoApproveNewAccounts: false })
            .accounts({ authority: confidentialTransferAuthority, mint })
            .instruction();
        ctx.sendInstruction(updateIx, [payer, confidentialTransferAuthority]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                {
                    __kind: 'ConfidentialTransferMint',
                    auditorElgamalPubkey: none(),
                    authority: some(confidentialTransferAuthority),
                    autoApproveNewAccounts: false,
                },
            ]),
        );
    });
});
