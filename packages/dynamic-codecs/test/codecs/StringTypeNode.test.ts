import { stringTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('base16', () => {
    const codec = getNodeCodec([stringTypeNode('base16')]);
    expect(codec.encode('deadb0d1e5')).toStrictEqual(hex('deadb0d1e5'));
    expect(codec.decode(hex('deadb0d1e5'))).toBe('deadb0d1e5');
});

test('base58', () => {
    const codec = getNodeCodec([stringTypeNode('base58')]);
    expect(codec.encode('heLLo')).toStrictEqual(hex('1b6a3070'));
    expect(codec.decode(hex('1b6a3070'))).toBe('heLLo');
});

test('base64', () => {
    const codec = getNodeCodec([stringTypeNode('base64')]);
    expect(codec.encode('HelloWorld++')).toStrictEqual(hex('1de965a16a2b95dfbe'));
    expect(codec.decode(hex('1de965a16a2b95dfbe'))).toBe('HelloWorld++');
});

test('utf8', () => {
    const codec = getNodeCodec([stringTypeNode('utf8')]);
    expect(codec.encode('Hello World!')).toStrictEqual(hex('48656c6c6f20576f726c6421'));
    expect(codec.decode(hex('48656c6c6f20576f726c6421'))).toBe('Hello World!');
});
