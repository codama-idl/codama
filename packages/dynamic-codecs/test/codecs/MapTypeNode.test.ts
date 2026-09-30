import {
    fixedCountNode,
    fixedSizeTransformNode,
    integerTypeNode,
    mapTypeNode,
    prefixedCountNode,
    remainderCountNode,
    stringTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

const key = stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(3)] });
const value = integerTypeNode('u16');
// eslint-disable-next-line sort-keys
const map = { foo: 42, bar: 99, baz: 650 };
// eslint-disable-next-line sort-keys
const decodedMap = { foo: 42n, bar: 99n, baz: 650n };

test('it decodes prefixed maps as objects', () => {
    const codec = getNodeValueCodec([mapTypeNode(key, value, prefixedCountNode(integerTypeNode('u32')))]);
    expect(codec.encode(map)).toStrictEqual(hex('03000000666f6f2a00626172630062617a8a02'));
    expect(codec.decode(hex('03000000666f6f2a00626172630062617a8a02'))).toStrictEqual(decodedMap);
});

test('it decodes fixed maps as objects', () => {
    const codec = getNodeValueCodec([mapTypeNode(key, value, fixedCountNode(3))]);
    expect(codec.encode(map)).toStrictEqual(hex('666f6f2a00626172630062617a8a02'));
    expect(codec.decode(hex('666f6f2a00626172630062617a8a02'))).toStrictEqual(decodedMap);
});

test('it decodes remainder maps as objects', () => {
    const codec = getNodeValueCodec([mapTypeNode(key, value, remainderCountNode())]);
    expect(codec.encode(map)).toStrictEqual(hex('666f6f2a00626172630062617a8a02'));
    expect(codec.decode(hex('666f6f2a00626172630062617a8a02'))).toStrictEqual(decodedMap);
});
