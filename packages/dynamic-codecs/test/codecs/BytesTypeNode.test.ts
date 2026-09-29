import { bytesTypeNode, integerTypeNode, sizePrefixTransformNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it uses base64 encoding by default', () => {
    const codec = getNodeValueCodec([bytesTypeNode()]);
    expect(codec.encode(['base64', 'HelloWorld++'])).toStrictEqual(hex('1de965a16a2b95dfbe'));
    expect(codec.decode(hex('1de965a16a2b95dfbe'))).toStrictEqual(['base64', 'HelloWorld++']);
});

test('it can use a custom default encoding', () => {
    const codec = getNodeValueCodec([bytesTypeNode()], { bytesEncoding: 'base16' });
    expect(codec.encode(['base16', 'deadb0d1e5'])).toStrictEqual(hex('deadb0d1e5'));
    expect(codec.decode(hex('deadb0d1e5'))).toStrictEqual(['base16', 'deadb0d1e5']);
});

test('the first tuple item is always used when encoding the data', () => {
    const codec = getNodeValueCodec([bytesTypeNode()], { bytesEncoding: 'base64' });
    expect(codec.encode(['base16', 'deadb0d1e5'])).toStrictEqual(hex('deadb0d1e5'));
    expect(codec.decode(hex('deadb0d1e5'))).toStrictEqual(['base64', '3q2w0eU=']);
});

test('it encodes raw bytes', () => {
    const codec = getNodeValueCodec([bytesTypeNode()]);
    expect(codec.encode(new Uint8Array([1, 2, 255]))).toStrictEqual(hex('0102ff'));
    expect(codec.decode(hex('0102ff'))).toStrictEqual(['base64', 'AQL/']);
});

test('it encodes raw bytes within size-prefixed types', () => {
    const codec = getNodeValueCodec([bytesTypeNode({ transforms: [sizePrefixTransformNode(integerTypeNode('u8'))] })]);
    expect(codec.encode(new Uint8Array([1, 2]))).toStrictEqual(hex('020102'));
});
