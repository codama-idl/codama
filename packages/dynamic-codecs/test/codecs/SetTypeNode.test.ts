import { fixedCountNode, integerTypeNode, prefixedCountNode, remainderCountNode, setTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it decodes prefixed sets', () => {
    const codec = getNodeValueCodec([setTypeNode(integerTypeNode('u16'), prefixedCountNode(integerTypeNode('u32')))]);
    expect(codec.encode([42, 99, 650])).toStrictEqual(hex('030000002a0063008a02'));
    expect(codec.decode(hex('030000002a0063008a02'))).toStrictEqual([42n, 99n, 650n]);
});

test('it decodes fixed sets', () => {
    const codec = getNodeValueCodec([setTypeNode(integerTypeNode('u16'), fixedCountNode(3))]);
    expect(codec.encode([42, 99, 650])).toStrictEqual(hex('2a0063008a02'));
    expect(codec.decode(hex('2a0063008a02'))).toStrictEqual([42n, 99n, 650n]);
});

test('it decodes remainder sets', () => {
    const codec = getNodeValueCodec([setTypeNode(integerTypeNode('u16'), remainderCountNode())]);
    expect(codec.encode([42, 99, 650])).toStrictEqual(hex('2a0063008a02'));
    expect(codec.decode(hex('2a0063008a02'))).toStrictEqual([42n, 99n, 650n]);
});
