import { durationTypeNode, integerTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes durations as their raw integer', () => {
    const codec = getNodeValueCodec([durationTypeNode(integerTypeNode('u32'), { ticksPerSecond: 1000 })]);
    expect(codec.encode(1500)).toStrictEqual(hex('dc050000'));
    expect(codec.decode(hex('dc050000'))).toBe(1500n);
});
