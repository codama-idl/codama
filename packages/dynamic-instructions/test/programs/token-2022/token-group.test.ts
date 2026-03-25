import type { Address } from '@solana/addresses';
import { some } from '@solana/codecs';
import { type Extension, getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

// Create a mint with GroupPointer + TokenGroup extensions
async function createGroupMint(ctx: SvmTestContext, payer: Address, groupUpdateAuthority: Address, maxSize: number) {
    const mint = ctx.createAccount();

    // Allocate only GroupPointer space (initializeMint2 rejects extra uninitialized TLV bytes)
    // initializeTokenGroup will realloc the account internally.
    const pointerSize = getMintSize([{ __kind: 'GroupPointer', authority: groupUpdateAuthority, groupAddress: mint }]);
    const fullSize = getMintSize([
        { __kind: 'GroupPointer', authority: groupUpdateAuthority, groupAddress: mint },
        { __kind: 'TokenGroup', maxSize, mint, size: 0, updateAuthority: some(groupUpdateAuthority) },
    ]);
    const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(fullSize));

    const createAccountIx = await systemClient.methods
        .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: pointerSize })
        .accounts({ newAccount: mint, payer })
        .instruction();

    const initGroupPointerIx = await token2022Client.methods
        .initializeGroupPointer({ authority: groupUpdateAuthority, groupAddress: mint })
        .accounts({ mint })
        .instruction();

    const initMintIx = await token2022Client.methods
        .initializeMint2({ decimals: 0, mintAuthority: payer })
        .accounts({ mint })
        .instruction();

    const initTokenGroupIx = await token2022Client.methods
        .initializeTokenGroup({ maxSize, updateAuthority: groupUpdateAuthority })
        .accounts({ group: mint, mint, mintAuthority: payer })
        .instruction();

    ctx.sendInstructions([createAccountIx, initGroupPointerIx, initMintIx, initTokenGroupIx], [payer, mint]);

    return mint;
}

describe('Token 2022 Program: tokenGroup', () => {
    test('should initialize token group [initializeTokenGroup]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const groupUpdateAuthority = ctx.createFundedAccount();
        const maxSize = 10;
        const mint = await createGroupMint(ctx, payer, groupUpdateAuthority, maxSize);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toMatchObject(
            some([
                { __kind: 'GroupPointer', authority: some(groupUpdateAuthority), groupAddress: some(mint) },
                {
                    __kind: 'TokenGroup',
                    maxSize: BigInt(maxSize),
                    size: 0n,
                    updateAuthority: { __option: 'Some', value: groupUpdateAuthority },
                },
            ]),
        );
    });

    test('should update token group max size [updateTokenGroupMaxSize]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const groupUpdateAuthority = ctx.createFundedAccount();
        const maxSize = 10;
        const newMaxSize = 20;
        const mint = await createGroupMint(ctx, payer, groupUpdateAuthority, maxSize);

        const updateMaxSizeIx = await token2022Client.methods
            .updateTokenGroupMaxSize({ maxSize: newMaxSize })
            .accounts({ group: mint, updateAuthority: groupUpdateAuthority })
            .instruction();
        ctx.sendInstruction(updateMaxSizeIx, [payer, groupUpdateAuthority]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toMatchObject(
            some([{ __kind: 'GroupPointer' }, { __kind: 'TokenGroup', maxSize: BigInt(newMaxSize) }]),
        );
    });

    test('should update token group update authority [updateTokenGroupUpdateAuthority]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const groupUpdateAuthority = ctx.createFundedAccount();
        const newUpdateAuthority = ctx.createFundedAccount();
        const maxSize = 10;
        const mint = await createGroupMint(ctx, payer, groupUpdateAuthority, maxSize);

        const updateAuthorityIx = await token2022Client.methods
            .updateTokenGroupUpdateAuthority({ newUpdateAuthority })
            .accounts({ group: mint, updateAuthority: groupUpdateAuthority })
            .instruction();
        ctx.sendInstruction(updateAuthorityIx, [payer, groupUpdateAuthority]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toMatchObject(
            some([
                { __kind: 'GroupPointer' },
                {
                    __kind: 'TokenGroup',
                    updateAuthority: { __option: 'Some', value: newUpdateAuthority },
                },
            ]),
        );
    });

    test('should initialize token group member [initializeTokenGroupMember]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const groupUpdateAuthority = ctx.createFundedAccount();

        const groupMint = await createGroupMint(ctx, payer, groupUpdateAuthority, 10);
        // const memberMint = await createMemberMint(ctx, payer, groupMint, groupUpdateAuthority);

        // Create a member mint with GroupMemberPointer + TokenGroupMember
        const memberMint = ctx.createAccount();
        // Allocate only GroupMemberPointer space; initializeTokenGroupMember will realloc.
        const pointerSize = getMintSize([
            { __kind: 'GroupMemberPointer', authority: payer, memberAddress: memberMint },
        ]);
        const fullSize = getMintSize([
            { __kind: 'GroupMemberPointer', authority: payer, memberAddress: memberMint },
            { __kind: 'TokenGroupMember', group: groupMint, memberNumber: 1, mint: memberMint },
        ]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(fullSize));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: pointerSize })
            .accounts({ newAccount: memberMint, payer })
            .instruction();

        const initMemberPointerIx = await token2022Client.methods
            .initializeGroupMemberPointer({ authority: payer, memberAddress: memberMint })
            .accounts({ mint: memberMint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 0, mintAuthority: payer })
            .accounts({ mint: memberMint })
            .instruction();

        const initTokenGroupMemberIx = await token2022Client.methods
            .initializeTokenGroupMember()
            .accounts({
                group: groupMint,
                groupUpdateAuthority,
                member: memberMint,
                memberMint,
                memberMintAuthority: payer,
            })
            .instruction();

        ctx.sendInstructions(
            [createAccountIx, initMemberPointerIx, initMintIx, initTokenGroupMemberIx],
            [payer, memberMint, groupUpdateAuthority],
        );

        // Verify TokenGroupMember extension
        const memberData = getMintDecoder().decode(ctx.requireEncodedAccount(memberMint).data);
        expect(memberData.extensions).toEqual(
            some<Extension[]>([
                { __kind: 'GroupMemberPointer', authority: some(payer), memberAddress: some(memberMint) },
                { __kind: 'TokenGroupMember', group: groupMint, memberNumber: 1n, mint: memberMint },
            ]),
        );

        // Verify incremented TokenGroup size
        const groupData = getMintDecoder().decode(ctx.requireEncodedAccount(groupMint).data);
        expect(groupData.extensions).toEqual(
            some<Extension[]>([
                { __kind: 'GroupPointer', authority: some(groupUpdateAuthority), groupAddress: some(groupMint) },
                {
                    __kind: 'TokenGroup',
                    maxSize: 10n,
                    mint: groupMint,
                    size: 1n,
                    updateAuthority: some(groupUpdateAuthority),
                },
            ]),
        );
    });
});
