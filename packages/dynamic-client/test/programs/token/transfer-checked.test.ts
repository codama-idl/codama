import { getTokenDecoder } from '@solana-program/token';
import { assertAccountsExist, type Lamports, type MaybeEncodedAccount } from '@solana/kit';
import {
    accountDataValueNode,
    accountLinkNode,
    injectedValueNode,
    instructionAccountNode,
    instructionNode,
    isNode,
    programNode,
    providedNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { createProgramClient, type FetchAccountsFn } from '../../../src';
import { loadRoot, SvmTestContext } from '../test-utils';
import { createMint, createTokenAccount, tokenClient } from './token-test-utils';

describe('Token Program: transferChecked', () => {
    test('should transfer tokens with mint and decimal verification', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mintAccount = await ctx.createAccount();
        const sourceAccount = await ctx.createAccount();
        const destinationAccount = await ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, payer);
        await createTokenAccount(ctx, payer, destinationAccount, mintAccount, payer);

        const mintIx = await tokenClient.methods
            .mintTo({ amount: 1_000_000 })
            .accounts({ mint: mintAccount, mintAuthority: payer, token: sourceAccount })
            .instruction();
        await ctx.sendInstruction(mintIx, [payer]);

        const ix = await tokenClient.methods
            .transferChecked({ amount: 400_000, decimals: 9 })
            .accounts({ authority: payer, destination: destinationAccount, mint: mintAccount, source: sourceAccount })
            .instruction();
        await ctx.sendInstruction(ix, [payer]);

        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        const destData = decoder.decode(ctx.requireEncodedAccount(destinationAccount).data);
        expect(sourceData.amount).toBe(600_000n);
        expect(destData.amount).toBe(400_000n);
    });

    test('should read the decimals from the mint account', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = await ctx.createFundedAccount();
        const mintAccount = await ctx.createAccount();
        const sourceAccount = await ctx.createAccount();
        const destinationAccount = await ctx.createAccount();

        await createMint(ctx, payer, mintAccount, payer);
        await createTokenAccount(ctx, payer, sourceAccount, mintAccount, payer);
        await createTokenAccount(ctx, payer, destinationAccount, mintAccount, payer);

        const mintIx = await tokenClient.methods
            .mintTo({ amount: 1_000_000 })
            .accounts({ mint: mintAccount, mintAuthority: payer, token: sourceAccount })
            .instruction();
        await ctx.sendInstruction(mintIx, [payer]);

        // Given a client whose transferChecked reads its decimals from the mint account.
        const fetchAccounts: FetchAccountsFn = addresses => {
            const accounts = addresses.map((address): MaybeEncodedAccount => {
                const account = ctx.fetchEncodedAccount(address);
                if (!account) return { address, exists: false };
                return {
                    address,
                    data: account.data,
                    executable: account.executable,
                    exists: true,
                    lamports: account.lamports as Lamports,
                    programAddress: account.owner,
                    space: BigInt(account.data.length),
                };
            });
            assertAccountsExist(accounts);
            return Promise.resolve(accounts);
        };
        const client = createProgramClient(getRootReadingDecimalsFromMint(), { fetchAccounts });

        // When building it without decimals.
        const ix = await client.methods
            .transferChecked({ amount: 400_000 })
            .accounts({ authority: payer, destination: destinationAccount, mint: mintAccount, source: sourceAccount })
            .instruction();

        // Then the program accepts the decimals read from the mint.
        await ctx.sendInstruction(ix, [payer]);
        const decoder = getTokenDecoder();
        const sourceData = decoder.decode(ctx.requireEncodedAccount(sourceAccount).data);
        const destData = decoder.decode(ctx.requireEncodedAccount(destinationAccount).data);
        expect(sourceData.amount).toBe(600_000n);
        expect(destData.amount).toBe(400_000n);
    });
});

/** The token IDL whose transferChecked defaults its decimals to the decimals of its mint. */
function getRootReadingDecimalsFromMint() {
    const root = loadRoot('token-idl.json');
    const instructions = (root.program.instructions ?? []).map(instruction => {
        if (instruction.identifier !== 'transferChecked' || !isNode(instruction.data, 'structTypeNode')) {
            return instruction;
        }
        return instructionNode({
            ...instruction,
            accounts: (instruction.accounts ?? []).map(account =>
                account.identifier === 'mint'
                    ? instructionAccountNode({ ...account, accountLink: accountLinkNode('mint') })
                    : account,
            ),
            data: structTypeNode(
                (instruction.data.fields ?? []).map(field =>
                    field.identifier === 'decimals'
                        ? structFieldTypeNode({ ...field, defaultValue: injectedValueNode({ key: 'decimals' }) })
                        : field,
                ),
            ),
            provides: [providedNode('decimals', accountDataValueNode('mint', { path: 'decimals' }))],
        });
    });
    return rootNode(programNode({ ...root.program, instructions }), { ...root });
}
