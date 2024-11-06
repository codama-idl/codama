import { constantValueNodeFromBytes, sentinelTypeNode, stringTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes sentinel types', () => {
    const sentinel = constantValueNodeFromBytes('base16', 'ffff');
    const codec = getNodeCodec([sentinelTypeNode(stringTypeNode('utf8'), sentinel)]);
    expect(codec.encode('Hello World!')).toStrictEqual(hex('48656c6c6f20576f726c6421ffff'));
    expect(codec.decode(hex('48656c6c6f20576f726c6421ffff'))).toBe('Hello World!');
});
