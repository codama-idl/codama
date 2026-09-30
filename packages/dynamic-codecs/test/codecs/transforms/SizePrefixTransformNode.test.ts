import { integerTypeNode, sizePrefixTransformNode, stringTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../../src';
import { hex } from '../../_setup';

test('it encodes types prefixed with their sizes', () => {
    const prefix = sizePrefixTransformNode(integerTypeNode('u32'));
    const codec = getNodeValueCodec([stringTypeNode('utf8', { transforms: [prefix] })]);
    expect(codec.encode('Hello World!')).toStrictEqual(hex('0c00000048656c6c6f20576f726c6421'));
    expect(codec.decode(hex('0c00000048656c6c6f20576f726c6421'))).toBe('Hello World!');
});

test('it encodes big-endian size prefixes', () => {
    const prefix = sizePrefixTransformNode(integerTypeNode('u16', { endian: 'be' }));
    const codec = getNodeValueCodec([stringTypeNode('utf8', { transforms: [prefix] })]);
    expect(codec.encode('Hi')).toStrictEqual(hex('00024869'));
    expect(codec.decode(hex('00024869'))).toBe('Hi');
});
