import { bytesTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { formatBytes, getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it formats bytes as hexadecimal', () => {
    const decoded = getNodeCodec([bytesTypeNode()]).decode(hex('01020aff'));
    expect(formatBytes(decoded)).toBe('0x01020aff');
});

test('it formats bytes as hexadecimal whatever the encoding they were decoded with', () => {
    const decoded = getNodeCodec([bytesTypeNode()], { bytesEncoding: 'base58' }).decode(hex('0001020aff'));
    expect(decoded.value[0]).toBe('base58');
    expect(formatBytes(decoded)).toBe('0x0001020aff');
});

test('it formats bytes decoded as utf8 as hexadecimal', () => {
    const decoded = getNodeCodec([bytesTypeNode()], { bytesEncoding: 'utf8' }).decode(hex('6869'));
    expect(decoded.value).toStrictEqual(['utf8', 'hi']);
    expect(formatBytes(decoded)).toBe('0x6869');
});

test('it formats empty bytes', () => {
    const decoded = getNodeCodec([bytesTypeNode()]).decode(hex(''));
    expect(formatBytes(decoded)).toBe('0x');
});
