import { some } from '@solana/codecs';
import { getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: pausable', () => {
    test('should pause the mint [initializePausableConfig + pause]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const pauseAuthority = await ctx.createFundedAccount();

        const size = getMintSize([{ __kind: 'PausableConfig', authority: pauseAuthority, paused: false }]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initPausableIx = await token2022Client.methods
            .initializePausableConfig({ authority: pauseAuthority })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initPausableIx, initMintIx], [payer, mint]);

        const mintUnpaused = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintUnpaused.extensions).toMatchObject(
            some([{ __kind: 'PausableConfig', authority: some(pauseAuthority), paused: false }]),
        );

        const pauseIx = await token2022Client.methods
            .pause()
            .accounts({ authority: pauseAuthority, mint })
            .signers(['authority'])
            .instruction();
        await ctx.sendInstruction(pauseIx, [payer, pauseAuthority]);

        const mintPaused = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintPaused.extensions).toMatchObject(
            some([{ __kind: 'PausableConfig', authority: some(pauseAuthority), paused: true }]),
        );
    });

    test('should resume the mint [initializePausableConfig + pause + resume]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        const pauseAuthority = await ctx.createFundedAccount();

        const size = getMintSize([{ __kind: 'PausableConfig', authority: pauseAuthority, paused: false }]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initPausableIx = await token2022Client.methods
            .initializePausableConfig({ authority: pauseAuthority })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initPausableIx, initMintIx], [payer, mint]);

        const pauseIx = await token2022Client.methods
            .pause()
            .accounts({ authority: pauseAuthority, mint })
            .signers(['authority'])
            .instruction();
        await ctx.sendInstruction(pauseIx, [payer, pauseAuthority]);

        const mintDataPaused = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintDataPaused.extensions).toMatchObject(
            some([{ __kind: 'PausableConfig', authority: some(pauseAuthority), paused: true }]),
        );

        const resumeIx = await token2022Client.methods
            .resume()
            .accounts({ authority: pauseAuthority, mint })
            .signers(['authority'])
            .instruction();
        await ctx.sendInstruction(resumeIx, [payer, pauseAuthority]);

        const mintDataResumed = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintDataResumed.extensions).toMatchObject(
            some([{ __kind: 'PausableConfig', authority: some(pauseAuthority), paused: false }]),
        );
    });
});
