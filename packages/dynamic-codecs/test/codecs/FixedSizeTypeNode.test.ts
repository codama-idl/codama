import { fixedSizeTypeNode, stringTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it decodes fixed size strings', () => {
    const codec = getNodeCodec([fixedSizeTypeNode(stringTypeNode('utf8'), 5)]);
    expect(codec.encode('Hello')).toStrictEqual(hex('48656c6c6f'));
    expect(codec.decode(hex('48656c6c6f'))).toBe('Hello');
    expect(codec.encode('Sup')).toStrictEqual(hex('5375700000'));
    expect(codec.decode(hex('5375700000'))).toBe('Sup');
});
