import type { Address } from '@solana/addresses';
import { type OptionOrNullable, some } from '@solana/codecs';
import { type Extension, type ExtensionArgs, getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

const GROUP_MEMBER_POINTER_EXT = (
    authority: OptionOrNullable<Address>,
    memberAddress: OptionOrNullable<Address>,
): ExtensionArgs[] => [{ __kind: 'GroupMemberPointer', authority, memberAddress }];

describe('Token 2022 Program: groupMemberPointer', () => {
    test('should initialize group member pointer extension [initializeGroupMemberPointer]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const memberPointerAuthority = ctx.createFundedAccount();

        // GroupMemberPointer points to the mint itself
        const size = getMintSize(GROUP_MEMBER_POINTER_EXT(memberPointerAuthority, mint));
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initGroupMemberPointerIx = await token2022Client.methods
            .initializeGroupMemberPointer({ authority: memberPointerAuthority, memberAddress: mint })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions([createAccountIx, initGroupMemberPointerIx, initMintIx], [payer, mint]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                {
                    __kind: 'GroupMemberPointer',
                    authority: some(memberPointerAuthority),
                    memberAddress: some(mint),
                },
            ]),
        );
    });

    test('should update group member pointer address [updateGroupMemberPointer]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const memberPointerAuthority = ctx.createFundedAccount();
        const newMemberAddress = ctx.createAccount();

        const size = getMintSize(GROUP_MEMBER_POINTER_EXT(memberPointerAuthority, mint));
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initGroupMemberPointerIx = await token2022Client.methods
            .initializeGroupMemberPointer({ authority: memberPointerAuthority, memberAddress: mint })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions([createAccountIx, initGroupMemberPointerIx, initMintIx], [payer, mint]);

        // Update group member pointer to a new address
        const updateIx = await token2022Client.methods
            .updateGroupMemberPointer({ memberAddress: newMemberAddress })
            .accounts({ groupMemberPointerAuthority: memberPointerAuthority, mint })
            .signers(['groupMemberPointerAuthority'])
            .instruction();
        ctx.sendInstruction(updateIx, [payer, memberPointerAuthority]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                {
                    __kind: 'GroupMemberPointer',
                    authority: some(memberPointerAuthority),
                    memberAddress: some(newMemberAddress),
                },
            ]),
        );
    });
});
