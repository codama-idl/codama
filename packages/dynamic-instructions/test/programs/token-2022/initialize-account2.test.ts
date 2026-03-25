import { some } from '@solana/codecs';
import { AccountState, getTokenDecoder, getTokenSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, systemClient, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: initializeAccount2', () => {
    test('should initialize2 a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const tokenAccount = ctx.createAccount();
        const owner = ctx.createFundedAccount();

        await createMint(ctx, payer, mintAccount, payer, undefined);
        const space = getTokenSize([{ __kind: 'MemoTransfer', requireIncomingTransferMemos: true }]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(space));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space })
            .accounts({ newAccount: tokenAccount, payer })
            .instruction();

        const initAccountIx = await token2022Client.methods
            .initializeAccount2({ owner })
            .accounts({ account: tokenAccount, mint: mintAccount })
            .instruction();

        const reallocateIx = await token2022Client.methods
            .reallocate({ newExtensionTypes: ['memoTransfer'] })
            .accounts({ owner, payer, token: tokenAccount })
            .signers(['owner'])
            .instruction();

        const enableMemoTransfersIx = await token2022Client.methods
            .enableMemoTransfers()
            .accounts({ owner, token: tokenAccount })
            .signers(['owner'])
            .instruction();

        ctx.sendInstructions(
            [createAccountIx, initAccountIx, reallocateIx, enableMemoTransfersIx],
            [payer, tokenAccount, owner],
        );

        const accountData = ctx.requireEncodedAccount(tokenAccount).data;
        const tokenData = getTokenDecoder().decode(accountData);

        expect(tokenData.mint).toBe(mintAccount);
        expect(tokenData.owner).toBe(owner);
        expect(tokenData.amount).toBe(0n);
        expect(tokenData.state).toBe(AccountState.Initialized);
        expect(tokenData.extensions).toMatchObject(
            some([{ __kind: 'MemoTransfer', requireIncomingTransferMemos: true }]),
        );
    });
});
