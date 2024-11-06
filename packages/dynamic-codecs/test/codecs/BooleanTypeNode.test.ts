import { booleanTypeNode, numberTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('default', () => {
    const codec = getNodeCodec([booleanTypeNode()]);
    expect(codec.encode(true)).toStrictEqual(hex('01'));
    expect(codec.decode(hex('01'))).toBe(true);
    expect(codec.encode(false)).toStrictEqual(hex('00'));
    expect(codec.decode(hex('00'))).toBe(false);
});

test('custom number', () => {
    const codec = getNodeCodec([booleanTypeNode(numberTypeNode('u32'))]);
    expect(codec.encode(true)).toStrictEqual(hex('01000000'));
    expect(codec.decode(hex('01000000'))).toBe(true);
    expect(codec.encode(false)).toStrictEqual(hex('00000000'));
    expect(codec.decode(hex('00000000'))).toBe(false);
});
