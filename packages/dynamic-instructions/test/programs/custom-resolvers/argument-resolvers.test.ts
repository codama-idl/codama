import type { Address } from '@solana/addresses';
import {
    addEncoderSizePrefix,
    getOptionEncoder,
    getU8Encoder,
    getU32Encoder,
    getUtf8Encoder,
    none,
    some,
} from '@solana/codecs';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { programClient } from './custom-resolvers-test-utils';

const utf8Encoder = getUtf8Encoder();
const u32Encoder = getU32Encoder();
const u8Encoder = getU8Encoder();
const stringEncoder = addEncoderSizePrefix(utf8Encoder, u32Encoder);

/**
 * Concat arguments for createItem ix data bytes:
 * [discriminator: u8] + [name: utf8] + [description: optional(utf8)] + [tags: optional(u8)]
 */
function expectedData({
    name,
    description,
    tags,
}: {
    description?: string | null;
    name: string;
    tags?: number | null;
}): Uint8Array {
    const discriminator = new Uint8Array([8]);
    const nameBytes = stringEncoder.encode(name);
    const descriptionBytes = getOptionEncoder(stringEncoder).encode(description ? some(description) : none());
    const tagsBytes = getOptionEncoder(u8Encoder).encode(tags ? some(tags) : none());

    return new Uint8Array([...discriminator, ...nameBytes, ...descriptionBytes, ...tagsBytes]);
}

describe('Custom resolvers: arguments ResolverValueNode', () => {
    let authority: Address;
    let ctx: SvmTestContext;

    beforeEach(async () => {
        ctx = new SvmTestContext();
        authority = await ctx.createFundedAccount();
    });

    test('should resolve omitted argument via resolver', async () => {
        const ix = await programClient.methods
            .createItem({ name: 'hello' })
            .accounts({ authority })
            .resolvers({ resolveDescription: () => Promise.resolve('auto-filled') })
            .instruction();

        expect(ix.data).toEqual(expectedData({ description: 'auto-filled', name: 'hello', tags: null }));
    });

    test('should bypass resolver when argument is explicitly provided', async () => {
        const ix = await programClient.methods
            .createItem({ description: 'explicit', name: 'hello' })
            .accounts({ authority })
            .resolvers({
                resolveDescription: () => {
                    throw new Error('should not be called');
                },
            })
            .instruction();

        expect(ix.data).toEqual(expectedData({ description: 'explicit', name: 'hello', tags: null }));
    });

    test('should call multiple resolvers independently', async () => {
        const ix = await programClient.methods
            .createItem({ name: 'multi' })
            .accounts({ authority })
            .resolvers({
                resolveDescription: () => Promise.resolve('desc'),
                resolveTags: () => Promise.resolve(42),
            })
            .instruction();

        expect(ix.data).toEqual(expectedData({ description: 'desc', name: 'multi', tags: 42 }));
    });

    test('should pass argumentsInput and accountsInput context to resolver', async () => {
        const expectedArgs = { name: 'context' };
        const expectedAccounts = { authority };
        const capturedArgs: Record<string, unknown> = {};
        const capturedAccounts: Record<string, unknown> = {};

        await programClient.methods
            .createItem(expectedArgs)
            .accounts(expectedAccounts)
            .resolvers({
                resolveDescription: (args, accounts) => {
                    Object.assign(capturedArgs, args);
                    Object.assign(capturedAccounts, accounts);
                    return Promise.resolve(null);
                },
            })
            .instruction();

        expect(capturedArgs).toEqual(expectedArgs);
        expect(capturedAccounts).toEqual(expectedAccounts);
    });

    test('should omit optional argument when no resolver provided', async () => {
        const ix = await programClient.methods
            .createItem({ name: 'no-resolver' })
            .accounts({ authority })
            .instruction();

        expect(ix.data).toEqual(expectedData({ description: null, name: 'no-resolver', tags: null }));
    });

    test('should propagate error when argument resolver throws', async () => {
        await expect(
            programClient.methods
                .createItem({ name: 'err' })
                .accounts({ authority })
                .resolvers({
                    resolveDescription: () => {
                        throw new Error('Error from resolver');
                    },
                })
                .instruction(),
        ).rejects.toThrow(
            /Resolver \[resolveDescription\] threw an error while resolving \[instructionArgumentNode\] \[description\]/,
        );

        await expect(
            programClient.methods
                .createItem({ name: 'err' })
                .accounts({ authority })
                .resolvers({
                    resolveDescription: () => Promise.reject(new Error('Async error from resolver')),
                })
                .instruction(),
        ).rejects.toThrow(
            /Resolver \[resolveDescription\] threw an error while resolving \[instructionArgumentNode\] \[description\]/,
        );
    });

    test('should encode optional argument as none when resolver returns undefined or null', async () => {
        const ix1 = await programClient.methods
            .createItem({ name: 'hello world 1' })
            .accounts({ authority })
            .resolvers({ resolveDescription: () => Promise.resolve(undefined) })
            .instruction();

        expect(ix1.data).toEqual(expectedData({ description: null, name: 'hello world 1', tags: null }));

        const ix2 = await programClient.methods
            .createItem({ name: 'hello world 2' })
            .accounts({ authority })
            .resolvers({ resolveDescription: () => Promise.resolve(null) })
            .instruction();

        expect(ix2.data).toEqual(expectedData({ description: null, name: 'hello world 2', tags: null }));
    });
});
