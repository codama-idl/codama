import { fixedPointTypeNode, integerTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes fixed points as their raw integer', () => {
    // 1.5 with a scale of 2 is stored as 150.
    const codec = getNodeValueCodec([fixedPointTypeNode(integerTypeNode('u16'), 2)]);
    expect(codec.encode(150)).toStrictEqual(hex('9600'));
    expect(codec.decode(hex('9600'))).toBe(150n);
});
