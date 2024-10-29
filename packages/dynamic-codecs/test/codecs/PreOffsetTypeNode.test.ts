import { numberTypeNode, preOffsetTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes relative pre-offsets', () => {
    const node = tupleTypeNode([
        preOffsetTypeNode(numberTypeNode('u8'), 1),
        preOffsetTypeNode(numberTypeNode('u8'), -2),
    ]);
    const codec = getNodeCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('ffaa'));
    expect(codec.decode(hex('ffaa'))).toStrictEqual([0xaa, 0xff]);
});

test('it encodes padded pre-offsets', () => {
    const node = tupleTypeNode([preOffsetTypeNode(numberTypeNode('u8'), 4, 'padded'), numberTypeNode('u8')]);
    const codec = getNodeCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('00000000aaff'));
    expect(codec.decode(hex('00000000aaff'))).toStrictEqual([0xaa, 0xff]);
});

test('it encodes absolute pre-offsets', () => {
    const node = tupleTypeNode([
        preOffsetTypeNode(numberTypeNode('u8'), 1),
        preOffsetTypeNode(numberTypeNode('u8'), 0, 'absolute'),
    ]);
    const codec = getNodeCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('ffaa'));
    expect(codec.decode(hex('ffaa'))).toStrictEqual([0xaa, 0xff]);
});
