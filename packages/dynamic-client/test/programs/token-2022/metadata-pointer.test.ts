import type { Address } from '@solana/addresses';
import { some } from '@solana/codecs';
import { type ExtensionArgs, getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

const METADATA_POINTER_EXT = (authority: Address, metadataAddress: Address): ExtensionArgs[] => [
    { __kind: 'MetadataPointer', authority, metadataAddress },
];

describe('Token 2022 Program: metadataPointer', () => {
    test('should initialize metadata pointer extension [initializeMetadataPointer]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const metadataPointerAuthority = await ctx.createFundedAccount();

        // MetadataPointer points to the mint itself
        const size = getMintSize(METADATA_POINTER_EXT(metadataPointerAuthority, mint));
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initMetadataPointerIx = await token2022Client.methods
            .initializeMetadataPointer({ authority: metadataPointerAuthority, metadataAddress: mint })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initMetadataPointerIx, initMintIx], [payer, mint]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.extensions).toMatchObject(
            some([
                {
                    __kind: 'MetadataPointer',
                    authority: some(metadataPointerAuthority),
                    metadataAddress: some(mint),
                },
            ]),
        );
    });

    test('should update metadata pointer address [updateMetadataPointer]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const metadataPointerAuthority = await ctx.createFundedAccount();
        const newMetadataAddress = await ctx.createAccount();

        const size = getMintSize(METADATA_POINTER_EXT(metadataPointerAuthority, mint));
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initMetadataPointerIx = await token2022Client.methods
            .initializeMetadataPointer({ authority: metadataPointerAuthority, metadataAddress: mint })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initMetadataPointerIx, initMintIx], [payer, mint]);

        // Update metadata pointer to a new address
        const updateIx = await token2022Client.methods
            .updateMetadataPointer({ metadataAddress: newMetadataAddress })
            .accounts({ metadataPointerAuthority, mint })
            .signers(['metadataPointerAuthority'])
            .instruction();
        await ctx.sendInstruction(updateIx, [payer, metadataPointerAuthority]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toMatchObject(
            some([{ __kind: 'MetadataPointer', metadataAddress: some(newMetadataAddress) }]),
        );
    });
});
