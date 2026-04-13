import type { Address } from '@solana/addresses';
import { some } from '@solana/codecs';
import { type Extension, type ExtensionArgs, getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

const getTransferHookExt = (authority: Address, programId: Address): ExtensionArgs[] => [
    { __kind: 'TransferHook', authority, programId },
];

describe('Token 2022 Program: transferHook', () => {
    test('should initialize transfer hook extension [initializeTransferHook]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const transferHookAuthority = await ctx.createFundedAccount();
        const hookProgramId = await ctx.createAccount();

        const size = getMintSize(getTransferHookExt(transferHookAuthority, hookProgramId));
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initTransferHookIx = await token2022Client.methods
            .initializeTransferHook({ authority: transferHookAuthority, programId: hookProgramId })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initTransferHookIx, initMintIx], [payer, mint]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                {
                    __kind: 'TransferHook',
                    authority: transferHookAuthority,
                    programId: hookProgramId,
                },
            ]),
        );
    });

    test('should update transfer hook program id [updateTransferHook]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const transferHookAuthority = await ctx.createFundedAccount();
        const hookProgramId = await ctx.createAccount();
        const newHookProgramId = await ctx.createAccount();

        const size = getMintSize(getTransferHookExt(transferHookAuthority, hookProgramId));
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));

        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initTransferHookIx = await token2022Client.methods
            .initializeTransferHook({ authority: transferHookAuthority, programId: hookProgramId })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initTransferHookIx, initMintIx], [payer, mint]);

        // Update transfer hook to a new program id
        const updateIx = await token2022Client.methods
            .updateTransferHook({ programId: newHookProgramId })
            .accounts({ authority: transferHookAuthority, mint })
            .signers(['authority'])
            .instruction();
        await ctx.sendInstruction(updateIx, [payer, transferHookAuthority]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                { __kind: 'TransferHook', authority: transferHookAuthority, programId: newHookProgramId },
            ]),
        );
    });
});
