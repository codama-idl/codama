import { booleanTypeNode, integerTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('default', () => {
    const codec = getNodeValueCodec([booleanTypeNode()]);
    expect(codec.encode(true)).toStrictEqual(hex('01'));
    expect(codec.decode(hex('01'))).toBe(true);
    expect(codec.encode(false)).toStrictEqual(hex('00'));
    expect(codec.decode(hex('00'))).toBe(false);
});

test('custom number', () => {
    const codec = getNodeValueCodec([booleanTypeNode({ size: integerTypeNode('u32') })]);
    expect(codec.encode(true)).toStrictEqual(hex('01000000'));
    expect(codec.decode(hex('01000000'))).toBe(true);
    expect(codec.encode(false)).toStrictEqual(hex('00000000'));
    expect(codec.decode(hex('00000000'))).toBe(false);
});

test('big-endian number', () => {
    const codec = getNodeValueCodec([booleanTypeNode({ size: integerTypeNode('u16', { endian: 'be' }) })]);
    expect(codec.encode(true)).toStrictEqual(hex('0001'));
    expect(codec.decode(hex('0001'))).toBe(true);
});
