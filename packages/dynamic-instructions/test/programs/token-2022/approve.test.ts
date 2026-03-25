import { getTokenDecoder } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    createMint,
    createTokenAccount,
    mintTokens,
    systemClient,
    TOKEN_2022_MULTISIG_SIZE,
    token2022Client,
} from './token-2022-test-utils';

describe('Token 2022 Program: approve', () => {
    test('should approve a delegate for a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const sourceAccount = ctx.createAccount();
        const delegate = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, payer);
        await mintTokens(ctx, payer, mintAccount, sourceAccount, payer, 1_000_000);

        const ix = await token2022Client.methods
            .approve({ amount: 500_000 })
            .accounts({ delegate, owner: payer, source: sourceAccount })
            .instruction();
        ctx.sendInstruction(ix, [payer]);

        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        expect(sourceData.delegate).toStrictEqual({ __option: 'Some', value: delegate });
        expect(sourceData.delegatedAmount).toBe(500_000n);
    });

    test('should approve with multisig', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const sourceAccount = ctx.createAccount();
        const delegate = ctx.createAccount();
        const multisigOwner = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, multisigOwner);
        await mintTokens(ctx, payer, mintAccount, sourceAccount, payer, 1_000_000);

        const signer1 = ctx.createAccount();
        const signer2 = ctx.createAccount();
        const signer3 = ctx.createAccount();

        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(TOKEN_2022_MULTISIG_SIZE));
        const createAccountIx = await systemClient.methods
            .createAccount({
                lamports,
                programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS,
                space: TOKEN_2022_MULTISIG_SIZE,
            })
            .accounts({ newAccount: multisigOwner, payer })
            .instruction();

        const initMultisigIx = await token2022Client.methods
            .initializeMultisig({ m: 2, signers: [signer1, signer2, signer3] })
            .accounts({ multisig: multisigOwner })
            .instruction();

        ctx.sendInstructions([createAccountIx, initMultisigIx], [payer, multisigOwner]);

        const ix = await token2022Client.methods
            .approve({ amount: 500_000, multiSigners: [signer1, signer2] })
            .accounts({ delegate, owner: multisigOwner, source: sourceAccount })
            .instruction();
        ctx.sendInstruction(ix, [payer, signer1, signer2]);

        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        expect(sourceData.delegate).toStrictEqual({ __option: 'Some', value: delegate });
        expect(sourceData.delegatedAmount).toBe(500_000n);
    });
});
