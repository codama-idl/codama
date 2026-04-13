import type { Address } from '@solana/addresses';
import { type OptionOrNullable, some } from '@solana/codecs';
import { type Extension, type ExtensionArgs, getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

const GROUP_POINTER_EXT = (
    authority: OptionOrNullable<Address>,
    groupAddress: OptionOrNullable<Address>,
): ExtensionArgs[] => [{ __kind: 'GroupPointer' as const, authority, groupAddress }];

describe('Token 2022 Program: groupPointer', () => {
    test('should initialize group pointer extension [initializeGroupPointer]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const groupPointerAuthority = await ctx.createFundedAccount();

        // GroupPointer points to the mint itself (common pattern)
        const size = getMintSize(GROUP_POINTER_EXT(groupPointerAuthority, mint));
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initGroupPointerIx = await token2022Client.methods
            .initializeGroupPointer({ authority: groupPointerAuthority, groupAddress: mint })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initGroupPointerIx, initMintIx], [payer, mint]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                {
                    __kind: 'GroupPointer',
                    authority: some(groupPointerAuthority),
                    groupAddress: some(mint),
                },
            ]),
        );
    });

    test('should update group pointer address [updateGroupPointer]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const groupPointerAuthority = await ctx.createFundedAccount();
        const newGroupAddress = await ctx.createAccount();

        const size = getMintSize(GROUP_POINTER_EXT(groupPointerAuthority, mint));
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initGroupPointerIx = await token2022Client.methods
            .initializeGroupPointer({ authority: groupPointerAuthority, groupAddress: mint })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initGroupPointerIx, initMintIx], [payer, mint]);

        // Update group pointer to a new address
        const updateIx = await token2022Client.methods
            .updateGroupPointer({ groupAddress: newGroupAddress })
            .accounts({ groupPointerAuthority, mint })
            .signers(['groupPointerAuthority'])
            .instruction();
        await ctx.sendInstruction(updateIx, [payer, groupPointerAuthority]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                { __kind: 'GroupPointer', authority: some(groupPointerAuthority), groupAddress: some(newGroupAddress) },
            ]),
        );
    });
});
