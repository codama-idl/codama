import { floatTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('f32', () => {
    const codec = getNodeValueCodec([floatTypeNode('f32')]);
    expect(codec.encode(1.5)).toStrictEqual(hex('0000c03f'));
    expect(codec.decode(hex('0000c03f'))).toBe(1.5);
});

test('f64', () => {
    const codec = getNodeValueCodec([floatTypeNode('f64')]);
    expect(codec.encode(1.5)).toStrictEqual(hex('000000000000f83f'));
    expect(codec.decode(hex('000000000000f83f'))).toBe(1.5);
});

test('big-endian', () => {
    const codec = getNodeValueCodec([floatTypeNode('f32', { endian: 'be' })]);
    expect(codec.encode(1.5)).toStrictEqual(hex('3fc00000'));
    expect(codec.decode(hex('3fc00000'))).toBe(1.5);
});
