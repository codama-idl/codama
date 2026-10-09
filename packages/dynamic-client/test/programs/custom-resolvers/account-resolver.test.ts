import { CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING } from '@codama/errors';
import type { Address } from '@solana/addresses';
import { type InstructionAccountNode, pluginNode } from 'codama';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { programClient } from './custom-resolvers-test-utils';

/**
 * The accounts of this IDL were resolved by custom resolvers in v1. Once
 * upgraded, they have no default value and carry `codama.resolver` plugins
 * instead, so callers provide them like any other account.
 */
describe('Custom resolvers: resolved accounts', () => {
    let authority: Address;
    let ctx: SvmTestContext;

    beforeEach(async () => {
        ctx = new SvmTestContext();
        authority = await ctx.createFundedAccount();
    });

    test('should keep the resolvers of accounts as codama.resolver plugins', () => {
        const instruction = programClient.instructions.get('transferWithResolver');
        const accounts = new Map<string, InstructionAccountNode>(
            (instruction?.accounts ?? []).map(account => [account.identifier, account]),
        );
        expect(accounts.get('destination')?.defaultValue).toBeUndefined();
        expect(accounts.get('destination')?.plugins).toStrictEqual([
            pluginNode('codama.resolver', { name: 'resolveDestination' }),
        ]);
        expect(accounts.get('treasury')?.plugins).toStrictEqual([
            pluginNode('codama.resolver', { name: 'resolveTreasury' }),
        ]);
    });

    test('should use the accounts provided in place of resolved accounts', async () => {
        const destination = await ctx.createFundedAccount();
        const treasury = await ctx.createFundedAccount();

        const ix = await programClient.methods
            .transferWithResolver({ amount: 100 })
            .accounts({ authority, destination, treasury })
            .instruction();

        expect(ix.accounts?.map(account => account.address)).toStrictEqual([authority, destination, treasury]);
    });

    test('should require resolved accounts that are not optional', async () => {
        await expect(
            programClient.methods
                .transferWithResolver({ amount: 100 })
                // @ts-expect-error - testing missing resolved accounts
                .accounts({ authority, treasury: null })
                .instruction(),
        ).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({
                    __code: CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
                    accountName: 'destination',
                    instructionName: 'transferWithResolver',
                }),
            }),
        );
    });

    test('should omit resolved accounts that are optional when given null', async () => {
        const destination = await ctx.createFundedAccount();

        const ix = await programClient.methods
            .transferWithResolver({ amount: 100 })
            .accounts({ authority, destination, treasury: null })
            .instruction();

        // Omitted optional accounts follow the `programId` optional account strategy.
        expect(ix.accounts?.[2].address).toBe(programClient.programAddress);
    });

    test('should handle accounts whose conditions were resolved like any other resolved account', async () => {
        // In v1, both accounts defaulted to a conditional value whose condition was resolved.
        const requiredTarget = await ctx.createAccount();

        const ix = await programClient.methods
            .conditionalTransfer()
            .accounts({ authority, optionalTarget: null, requiredTarget })
            .instruction();
        expect(ix.accounts?.map(account => account.address)).toStrictEqual([
            authority,
            programClient.programAddress,
            requiredTarget,
        ]);

        await expect(
            programClient.methods
                .conditionalTransfer()
                // @ts-expect-error - testing a missing resolved account
                .accounts({ authority, optionalTarget: null })
                .instruction(),
        ).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({
                    __code: CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
                    accountName: 'requiredTarget',
                    instructionName: 'conditionalTransfer',
                }),
            }),
        );
    });
});
