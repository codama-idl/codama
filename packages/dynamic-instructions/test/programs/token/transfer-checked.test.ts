import { getTokenDecoder } from '@solana-program/token';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, tokenClient } from './token-test-utils';

describe('Token Program: transferChecked', () => {
    test('should transfer tokens with mint and decimal verification', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mintAccount = ctx.createAccount();
        const sourceAccount = ctx.createAccount();
        const destinationAccount = ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, payer);
        await createTokenAccount(ctx, payer, destinationAccount, mintAccount, payer);

        const mintIx = await tokenClient.methods
            .mintTo({ amount: 1_000_000 })
            .accounts({ mint: mintAccount, mintAuthority: payer, token: sourceAccount })
            .instruction();
        ctx.sendInstruction(mintIx, [payer]);

        const ix = await tokenClient.methods
            .transferChecked({ amount: 400_000, decimals: 9 })
            .accounts({ authority: payer, destination: destinationAccount, mint: mintAccount, source: sourceAccount })
            .instruction();
        ctx.sendInstruction(ix, [payer]);

        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        const destData = decoder.decode(ctx.requireEncodedAccount(destinationAccount).data);
        expect(sourceData.amount).toBe(600_000n);
        expect(destData.amount).toBe(400_000n);
    });
});
