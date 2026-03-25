import type { Address } from '@solana/addresses';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { programClient } from './custom-resolvers-test-utils';

describe('Custom resolvers: accounts ResolverValueNode', () => {
    let authority: Address;
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        authority = ctx.createFundedAccount();
    });

    test('should resolve accounts addresses via resolver', async () => {
        const destination = ctx.createFundedAccount();
        const treasury = ctx.createFundedAccount();

        const expectedAccounts = [authority, destination, treasury];
        const ix = await programClient.methods
            .transferWithResolver({ amount: 100 })
            .accounts({ authority })
            .resolvers({
                resolveDestination: () => Promise.resolve(destination),
                resolveTreasury: () => Promise.resolve(treasury),
            })
            .instruction();

        expect(ix.accounts?.length).toBe(3);
        ix.accounts?.forEach((accountMeta, index) => {
            expect(accountMeta.address).toBe(expectedAccounts[index]);
        });
    });

    test('should throw AccountError when resolver missing for required account', async () => {
        await expect(
            programClient.methods.transferWithResolver({ amount: 100 }).accounts({ authority }).instruction(),
        ).rejects.toThrow(/Resolver "resolveDestination" not provided for account "destination"/);
    });

    test('should throw AccountError when resolver returns null/undefined for required account', async () => {
        const treasury = ctx.createAccount();
        await expect(
            programClient.methods
                .transferWithResolver({ amount: 100 })
                .accounts({ authority, treasury })
                .resolvers({
                    resolveDestination: () => Promise.resolve(null),
                })
                .instruction(),
        ).rejects.toThrow(/Resolver "resolveDestination" returned invalid address null for account "destination"/);

        await expect(
            programClient.methods
                .transferWithResolver({ amount: 100 })
                .accounts({ authority, treasury })
                .resolvers({
                    resolveDestination: () => Promise.resolve(undefined),
                })
                .instruction(),
        ).rejects.toThrow(/Resolver "resolveDestination" returned invalid address undefined for account "destination"/);
    });

    test('should propagate error when account resolver rejects', async () => {
        await expect(
            programClient.methods
                .transferWithResolver({ amount: 100 })
                .accounts({ authority })
                .resolvers({
                    resolveDestination: () => Promise.reject(new Error('resolver failed')),
                    resolveTreasury: () => Promise.resolve(ctx.SYSTEM_PROGRAM_ADDRESS),
                })
                .instruction(),
        ).rejects.toThrow(/Resolver "resolveDestination" threw an error while resolving account "destination"/);
    });

    test('should throw when resolver missing for optional undefined account with direct resolverValueNode', async () => {
        const destination = ctx.createFundedAccount();

        await expect(
            programClient.methods
                .transferWithResolver({ amount: 100 })
                .accounts({ authority })
                .resolvers({
                    resolveDestination: () => Promise.resolve(destination),
                })
                .instruction(),
        ).rejects.toThrow(/Resolver "resolveTreasury" not provided for account "treasury"/);

        // double-check: when we provide null, treasury will be resolved into programId even without resolveTreasury resolver.
        const ix = await programClient.methods
            .transferWithResolver({ amount: 100 })
            .accounts({ authority, treasury: null })
            .resolvers({
                resolveDestination: () => Promise.resolve(destination),
            })
            .instruction();
        expect(ix.accounts?.[2].address).toBe(programClient.programAddress);
    });

    test('should bypass resolver when account is explicitly provided', async () => {
        const destination = ctx.createAccount();
        const treasury = ctx.createAccount();

        const ix = await programClient.methods
            .transferWithResolver({ amount: 42 })
            .accounts({ authority, destination, treasury })
            .resolvers({
                resolveDestination: () => {
                    throw new Error('resolveDestination should not be called');
                },
                resolveTreasury: () => {
                    throw new Error('resolveTreasury should not be called');
                },
            })
            .instruction();

        expect(ix.accounts?.[1].address).toBe(destination);
        expect(ix.accounts?.[2].address).toBe(treasury);
    });

    test('should resolve to programId when resolver returns null', async () => {
        const ix = await programClient.methods
            .conditionalTransfer()
            .accounts({ authority })
            .resolvers({
                resolveIncludeRequired: () => Promise.resolve(true),
                resolveIncludeTarget: () => Promise.resolve(null),
            })
            .instruction();

        expect(ix.accounts?.[1].address).toBe(programClient.programAddress);
    });

    test('should throw AccountError when omitted required account conditional has no ifFalse and condition is falsy', async () => {
        await expect(
            programClient.methods
                .conditionalTransfer()
                .accounts({ authority })
                .resolvers({
                    resolveIncludeRequired: () => Promise.resolve(false),
                    resolveIncludeTarget: () => Promise.resolve(true),
                })
                .instruction(),
        ).rejects.toThrow(
            /Conditional branch resolved to undefined in account "requiredTarget" of "conditionalTransfer" instruction/,
        );
    });
});
