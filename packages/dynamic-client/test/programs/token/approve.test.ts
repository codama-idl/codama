import { getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, SPL_TOKEN_MULTISIG_SIZE, systemClient, tokenClient } from './token-test-utils';

describe('Token Program: approve', () => {
    test('should approve a delegate for a token account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mintAccount = await ctx.createAccount();
        const sourceAccount = await ctx.createAccount();
        const delegate = await ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, payer);

        const mintIx = await tokenClient.methods
            .mintTo({ amount: 1_000_000 })
            .accounts({ mint: mintAccount, mintAuthority: payer, token: sourceAccount })
            .instruction();
        await ctx.sendInstruction(mintIx, [payer]);

        const ix = await tokenClient.methods
            .approve({ amount: 500_000 })
            .accounts({ delegate, owner: payer, source: sourceAccount })
            .instruction();
        await ctx.sendInstruction(ix, [payer]);

        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        expect(sourceData.delegate).toStrictEqual({ __option: 'Some', value: delegate });
        expect(sourceData.delegatedAmount).toBe(500_000n);
    });

    test('should approve with multisig', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mintAccount = await ctx.createAccount();
        const sourceAccount = await ctx.createAccount();
        const delegate = await ctx.createAccount();
        const multisigOwner = await ctx.createAccount();

        // Create mints
        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, multisigOwner);

        const mintIx = await tokenClient.methods
            .mintTo({ amount: 1_000_000 })
            .accounts({ mint: mintAccount, mintAuthority: payer, token: sourceAccount })
            .instruction();
        await ctx.sendInstruction(mintIx, [payer]);

        // Create multisignature owner
        const signer1 = await ctx.createAccount();
        const signer2 = await ctx.createAccount();
        const signer3 = await ctx.createAccount();

        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(SPL_TOKEN_MULTISIG_SIZE));
        const createAccountIx = await systemClient.methods
            .createAccount({
                lamports,
                programAddress: tokenClient.programAddress,
                space: SPL_TOKEN_MULTISIG_SIZE,
            })
            .accounts({ newAccount: multisigOwner, payer })
            .instruction();

        const initMultisigIx = await tokenClient.methods
            .initializeMultisig({ m: 2, signers: [signer1, signer2, signer3] })
            .accounts({ multisig: multisigOwner })
            .instruction();

        await ctx.sendInstructions([createAccountIx, initMultisigIx], [payer, multisigOwner]);

        // Approve delegate with multisig owner,
        // providing signer1 and signer2 without signing by multisigOwner
        const ix = await tokenClient.methods
            .approve({ amount: 500_000, multiSigners: [signer1, signer2] })
            .accounts({ delegate, owner: multisigOwner, source: sourceAccount })
            .instruction();
        await ctx.sendInstruction(ix, [payer, signer1, signer2]);

        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        expect(sourceData.delegate).toStrictEqual({ __option: 'Some', value: delegate });
        expect(sourceData.delegatedAmount).toBe(500_000n);
    });
});
