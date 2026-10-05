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
import { pluginNode, type StructFieldTypeNode } from 'codama';
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

/**
 * The data fields of this IDL were resolved by custom resolvers in v1. Once
 * upgraded, they have no default value and carry `codama.resolver` plugins
 * instead, so callers provide them like any other data field.
 */
describe('Custom resolvers: resolved data fields', () => {
    let authority: Address;
    let ctx: SvmTestContext;

    beforeEach(async () => {
        ctx = new SvmTestContext();
        authority = await ctx.createFundedAccount();
    });

    test('should keep the resolvers of data fields as codama.resolver plugins', () => {
        const data = programClient.instructions.get('createItem')?.data;
        const fields = new Map<string, StructFieldTypeNode>(
            (data?.kind === 'structTypeNode' ? (data.fields ?? []) : []).map(field => [field.identifier, field]),
        );
        expect(fields.get('description')?.defaultValue).toBeUndefined();
        expect(fields.get('description')?.plugins).toStrictEqual([
            pluginNode('codama.resolver', { name: 'resolveDescription' }),
        ]);
        expect(fields.get('tags')?.plugins).toStrictEqual([pluginNode('codama.resolver', { name: 'resolveTags' })]);
        expect(fields.get('tags')?.defaultValueStrategy).toBe('optional');
    });

    test('should encode the data provided in place of resolved fields', async () => {
        const ix = await programClient.methods
            .createItem({ description: 'explicit', name: 'hello', tags: 42 })
            .accounts({ authority })
            .instruction();

        expect(ix.data).toEqual(expectedData({ description: 'explicit', name: 'hello', tags: 42 }));
    });

    test('should encode omitted optional resolved fields as none', async () => {
        const ix = await programClient.methods.createItem({ name: 'hello' }).accounts({ authority }).instruction();

        expect(ix.data).toEqual(expectedData({ description: null, name: 'hello', tags: null }));
    });
});
