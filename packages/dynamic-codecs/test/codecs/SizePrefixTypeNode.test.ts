import { numberTypeNode, sizePrefixTypeNode, stringTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes types prefixed with their sizes', () => {
    const codec = getNodeCodec([sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'))]);
    expect(codec.encode('Hello World!')).toStrictEqual(hex('0c00000048656c6c6f20576f726c6421'));
    expect(codec.decode(hex('0c00000048656c6c6f20576f726c6421'))).toBe('Hello World!');
});
