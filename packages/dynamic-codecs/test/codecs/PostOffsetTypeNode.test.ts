import { fixedSizeTypeNode, numberTypeNode, postOffsetTypeNode, preOffsetTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes relative post-offsets', () => {
    const node = tupleTypeNode([
        postOffsetTypeNode(fixedSizeTypeNode(numberTypeNode('u8'), 4), -2),
        numberTypeNode('u8'),
    ]);
    const codec = getNodeCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('aa00ff0000'));
    expect(codec.decode(hex('aa00ff0000'))).toStrictEqual([0xaa, 0xff]);
});

test('it encodes padded post-offsets', () => {
    const node = tupleTypeNode([postOffsetTypeNode(numberTypeNode('u8'), 4, 'padded'), numberTypeNode('u8')]);
    const codec = getNodeCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('aa00000000ff'));
    expect(codec.decode(hex('aa00000000ff'))).toStrictEqual([0xaa, 0xff]);
});

test('it encodes absolute post-offsets', () => {
    const node = tupleTypeNode([
        postOffsetTypeNode(fixedSizeTypeNode(numberTypeNode('u8'), 4), -2, 'absolute'),
        numberTypeNode('u8'),
    ]);
    const codec = getNodeCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('aa0000ff00'));
    expect(codec.decode(hex('aa0000ff00'))).toStrictEqual([0xaa, 0xff]);
});

test('it encodes post-offsets relative to the previous pre-offset', () => {
    const node = tupleTypeNode([
        postOffsetTypeNode(preOffsetTypeNode(numberTypeNode('u8'), 4, 'padded'), 0, 'preOffset'),
        numberTypeNode('u8'),
    ]);
    const codec = getNodeCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('ff000000aa00'));
    expect(codec.decode(hex('ff000000aa00'))).toStrictEqual([0xaa, 0xff]);
});
