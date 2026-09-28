import {
    arrayTypeNode,
    constantValueNodeFromBytes,
    fixedSizeTransformNode,
    integerTypeNode,
    mapTypeNode,
    sentinelCountNode,
    setTypeNode,
    stringTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { SOLANA_ERROR__CODECS__SENTINEL_MISSING_AT_END_OF_BYTES, SolanaError } from '@solana/errors';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

const sentinel = constantValueNodeFromBytes('base16', 'ffff');

test('it reads items until the sentinel is found', () => {
    const codec = getNodeValueCodec([arrayTypeNode(integerTypeNode('u16'), sentinelCountNode(sentinel))]);
    expect(codec.encode([42, 99])).toStrictEqual(hex('2a006300ffff'));
    expect(codec.decode(hex('2a006300ffff'))).toStrictEqual([42n, 99n]);
    expect(codec.encode([])).toStrictEqual(hex('ffff'));
    expect(codec.decode(hex('ffff'))).toStrictEqual([]);
});

test('it only compares the sentinel at item boundaries', () => {
    // The first item contains the sentinel bytes at an offset of one byte.
    const item = tupleTypeNode([integerTypeNode('u8'), integerTypeNode('u16')]);
    const codec = getNodeValueCodec([arrayTypeNode(item, sentinelCountNode(sentinel))]);
    expect(codec.encode([[1, 0xffff]])).toStrictEqual(hex('01ffffffff'));
    expect(codec.decode(hex('01ffffffff'))).toStrictEqual([[1n, 0xffffn]]);
});

test('it lets the next attribute read the bytes after the sentinel', () => {
    const codec = getNodeValueCodec([
        tupleTypeNode([arrayTypeNode(integerTypeNode('u8'), sentinelCountNode(sentinel)), integerTypeNode('u8')]),
    ]);
    expect(codec.encode([[1, 2], 3])).toStrictEqual(hex('0102ffff03'));
    expect(codec.decode(hex('0102ffff03'))).toStrictEqual([[1n, 2n], 3n]);
});

test('it requires the sentinel by default', () => {
    const codec = getNodeValueCodec([arrayTypeNode(integerTypeNode('u16'), sentinelCountNode(sentinel))]);
    expect(() => codec.decode(hex('2a006300'))).toThrow(
        new SolanaError(SOLANA_ERROR__CODECS__SENTINEL_MISSING_AT_END_OF_BYTES, {
            codecDescription: 'array',
            hexSentinel: 'ffff',
            sentinel: hex('ffff'),
        }),
    );
});

test('it writes the sentinel but tolerates its absence with the optional strategy', () => {
    const codec = getNodeValueCodec([
        arrayTypeNode(integerTypeNode('u16'), sentinelCountNode(sentinel, { strategy: 'optional' })),
    ]);
    expect(codec.encode([42, 99])).toStrictEqual(hex('2a006300ffff'));
    expect(codec.decode(hex('2a006300ffff'))).toStrictEqual([42n, 99n]);
    expect(codec.decode(hex('2a006300'))).toStrictEqual([42n, 99n]);
});

test('it never writes the sentinel with the omitted strategy', () => {
    const codec = getNodeValueCodec([
        arrayTypeNode(integerTypeNode('u16'), sentinelCountNode(sentinel, { strategy: 'omitted' })),
    ]);
    expect(codec.encode([42, 99])).toStrictEqual(hex('2a006300'));
    expect(codec.decode(hex('2a006300'))).toStrictEqual([42n, 99n]);
    // A sentinel that is present is still consumed.
    expect(codec.decode(hex('2a006300ffff'))).toStrictEqual([42n, 99n]);
});

test('it supports sets and maps', () => {
    const set = getNodeValueCodec([setTypeNode(integerTypeNode('u8'), sentinelCountNode(sentinel))]);
    expect(set.encode([1, 2])).toStrictEqual(hex('0102ffff'));
    expect(set.decode(hex('0102ffff'))).toStrictEqual([1n, 2n]);

    const key = stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(1)] });
    const map = getNodeValueCodec([mapTypeNode(key, integerTypeNode('u8'), sentinelCountNode(sentinel))]);
    expect(map.encode({ a: 1 })).toStrictEqual(hex('6101ffff'));
    expect(map.decode(hex('6101ffff'))).toStrictEqual({ a: 1n });
});
