import {
    fixedCountNode,
    fixedSizeTypeNode,
    mapTypeNode,
    numberTypeNode,
    prefixedCountNode,
    remainderCountNode,
    stringTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it decodes prefixed maps as objects', () => {
    const key = fixedSizeTypeNode(stringTypeNode('utf8'), 3);
    const value = numberTypeNode('u16');
    const codec = getNodeCodec([mapTypeNode(key, value, prefixedCountNode(numberTypeNode('u32')))]);
    // eslint-disable-next-line sort-keys-fix/sort-keys-fix
    const map = { foo: 42, bar: 99, baz: 650 };
    expect(codec.encode(map)).toStrictEqual(hex('03000000666f6f2a00626172630062617a8a02'));
    expect(codec.decode(hex('03000000666f6f2a00626172630062617a8a02'))).toStrictEqual(map);
});

test('it decodes fixed maps as objects', () => {
    const key = fixedSizeTypeNode(stringTypeNode('utf8'), 3);
    const value = numberTypeNode('u16');
    const codec = getNodeCodec([mapTypeNode(key, value, fixedCountNode(3))]);
    // eslint-disable-next-line sort-keys-fix/sort-keys-fix
    const map = { foo: 42, bar: 99, baz: 650 };
    expect(codec.encode(map)).toStrictEqual(hex('666f6f2a00626172630062617a8a02'));
    expect(codec.decode(hex('666f6f2a00626172630062617a8a02'))).toStrictEqual(map);
});

test('it decodes remainder maps as objects', () => {
    const key = fixedSizeTypeNode(stringTypeNode('utf8'), 3);
    const value = numberTypeNode('u16');
    const codec = getNodeCodec([mapTypeNode(key, value, remainderCountNode())]);
    // eslint-disable-next-line sort-keys-fix/sort-keys-fix
    const map = { foo: 42, bar: 99, baz: 650 };
    expect(codec.encode(map)).toStrictEqual(hex('666f6f2a00626172630062617a8a02'));
    expect(codec.decode(hex('666f6f2a00626172630062617a8a02'))).toStrictEqual(map);
});
