import { fixedCountNode, numberTypeNode, prefixedCountNode, remainderCountNode, setTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it decodes prefixed sets', () => {
    const codec = getNodeCodec([setTypeNode(numberTypeNode('u16'), prefixedCountNode(numberTypeNode('u32')))]);
    expect(codec.encode([42, 99, 650])).toStrictEqual(hex('030000002a0063008a02'));
    expect(codec.decode(hex('030000002a0063008a02'))).toStrictEqual([42, 99, 650]);
});

test('it decodes fixed sets', () => {
    const codec = getNodeCodec([setTypeNode(numberTypeNode('u16'), fixedCountNode(3))]);
    expect(codec.encode([42, 99, 650])).toStrictEqual(hex('2a0063008a02'));
    expect(codec.decode(hex('2a0063008a02'))).toStrictEqual([42, 99, 650]);
});

test('it decodes remainder sets', () => {
    const codec = getNodeCodec([setTypeNode(numberTypeNode('u16'), remainderCountNode())]);
    expect(codec.encode([42, 99, 650])).toStrictEqual(hex('2a0063008a02'));
    expect(codec.decode(hex('2a0063008a02'))).toStrictEqual([42, 99, 650]);
});
