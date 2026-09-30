import {
    fixedSizeTransformNode,
    integerTypeNode,
    postOffsetTransformNode,
    preOffsetTransformNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../../src';
import { hex } from '../../_setup';

test('it encodes relative post-offsets', () => {
    const node = tupleTypeNode([
        integerTypeNode('u8', { transforms: [fixedSizeTransformNode(4), postOffsetTransformNode(-2)] }),
        integerTypeNode('u8'),
    ]);
    const codec = getNodeValueCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('aa00ff0000'));
    expect(codec.decode(hex('aa00ff0000'))).toStrictEqual([0xaan, 0xffn]);
});

test('it encodes padded post-offsets', () => {
    const node = tupleTypeNode([
        integerTypeNode('u8', { transforms: [postOffsetTransformNode(4, { strategy: 'padded' })] }),
        integerTypeNode('u8'),
    ]);
    const codec = getNodeValueCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('aa00000000ff'));
    expect(codec.decode(hex('aa00000000ff'))).toStrictEqual([0xaan, 0xffn]);
});

test('it encodes absolute post-offsets', () => {
    const node = tupleTypeNode([
        integerTypeNode('u8', {
            transforms: [fixedSizeTransformNode(4), postOffsetTransformNode(-2, { strategy: 'absolute' })],
        }),
        integerTypeNode('u8'),
    ]);
    const codec = getNodeValueCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('aa0000ff00'));
    expect(codec.decode(hex('aa0000ff00'))).toStrictEqual([0xaan, 0xffn]);
});

test('it encodes post-offsets relative to the previous pre-offset', () => {
    const node = tupleTypeNode([
        integerTypeNode('u8', {
            transforms: [
                preOffsetTransformNode(4, { strategy: 'padded' }),
                postOffsetTransformNode(0, { strategy: 'preOffset' }),
            ],
        }),
        integerTypeNode('u8'),
    ]);
    const codec = getNodeValueCodec([node]);
    expect(codec.encode([0xaa, 0xff])).toStrictEqual(hex('ff000000aa00'));
    expect(codec.decode(hex('ff000000aa00'))).toStrictEqual([0xaan, 0xffn]);
});
