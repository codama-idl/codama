import { address, getAddressEncoder } from '@solana/addresses';
import { getUtf8Codec } from '@solana/codecs';
import {
    constantValueNode,
    mapValueNode,
    noneValueNode,
    numberValueNode,
    programIdValueNode,
    programNode,
    rootNode,
    someValueNode,
    stringTypeNode,
    stringValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { resolveConstantPdaSeedValue } from '../../src/resolvers/resolve-constant-pda-seed-value';
import { CONSTANT_PDA_SEED_VALUE_SUPPORTED_NODE_KINDS } from '../../src/visitors';

const PROGRAM_PUBLIC_KEY = '11111111111111111111111111111111';
const ctx = {
    programId: address(PROGRAM_PUBLIC_KEY),
    root: rootNode(programNode({ name: 'test', publicKey: PROGRAM_PUBLIC_KEY })),
};

describe('resolveConstantPdaSeedValue', () => {
    test('should dispatch to the correct visitor method (stringValueNode)', async () => {
        const result = await resolveConstantPdaSeedValue(stringValueNode('hello'), ctx);
        expect(result).toEqual(getUtf8Codec().encode('hello'));
    });

    test('should dispatch programIdValueNode and encode ctx programId', async () => {
        const result = await resolveConstantPdaSeedValue(programIdValueNode(), ctx);
        expect(result).toEqual(getAddressEncoder().encode(ctx.programId));
    });

    test('should dispatch numberValueNode as a u8 byte', async () => {
        const result = await resolveConstantPdaSeedValue(numberValueNode(42), ctx);
        expect(result).toEqual(new Uint8Array([42]));
    });

    test('should dispatch someValueNode and recurse into the wrapped value', async () => {
        const result = await resolveConstantPdaSeedValue(someValueNode(stringValueNode('hi')), ctx);
        expect(result).toEqual(getUtf8Codec().encode('hi'));
    });

    test('should dispatch constantValueNode and recurse into the wrapped value', async () => {
        const result = await resolveConstantPdaSeedValue(
            constantValueNode(stringTypeNode('utf8'), stringValueNode('hi')),
            ctx,
        );
        expect(result).toEqual(getUtf8Codec().encode('hi'));
    });

    test('should dispatch noneValueNode as zero bytes', async () => {
        const result = await resolveConstantPdaSeedValue(noneValueNode(), ctx);
        expect(result).toEqual(new Uint8Array(0));
    });

    test('should throw UNEXPECTED_NODE_KIND for unsupported value node kind', async () => {
        await expect(resolveConstantPdaSeedValue(mapValueNode([]), ctx)).rejects.toThrow(
            `Expected node of kind [${CONSTANT_PDA_SEED_VALUE_SUPPORTED_NODE_KINDS.join(',')}], got [mapValueNode]`,
        );
    });
});
