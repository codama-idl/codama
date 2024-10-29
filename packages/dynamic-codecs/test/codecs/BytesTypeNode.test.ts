import { bytesTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it uses base64 encoding by default', () => {
    const codec = getNodeCodec([bytesTypeNode()]);
    expect(codec.encode(['base64', 'HelloWorld++'])).toStrictEqual(hex('1de965a16a2b95dfbe'));
    expect(codec.decode(hex('1de965a16a2b95dfbe'))).toStrictEqual(['base64', 'HelloWorld++']);
});

test('it can use a custom default encoding', () => {
    const codec = getNodeCodec([bytesTypeNode()], { bytesEncoding: 'base16' });
    expect(codec.encode(['base16', 'deadb0d1e5'])).toStrictEqual(hex('deadb0d1e5'));
    expect(codec.decode(hex('deadb0d1e5'))).toStrictEqual(['base16', 'deadb0d1e5']);
});

test('the first tuple item is always used when encoding the data', () => {
    const codec = getNodeCodec([bytesTypeNode()], { bytesEncoding: 'base64' });
    expect(codec.encode(['base16', 'deadb0d1e5'])).toStrictEqual(hex('deadb0d1e5'));
    expect(codec.decode(hex('deadb0d1e5'))).toStrictEqual(['base64', '3q2w0eU=']);
});
