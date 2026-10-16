import { stringDisplayNode, stringTypeNode } from '@codama/nodes';
import { getUtf8Encoder } from '@solana/codecs';
import { expect, test } from 'vitest';

import { formatString, getNodeCodec } from '../../src';

test('it formats strings as their value', () => {
    const decoded = getNodeCodec([stringTypeNode('utf8')]).decode(getUtf8Encoder().encode('abcdefg'));
    expect(formatString(decoded)).toBe('abcdefg');
});

test('it formats strings sliced by their display', () => {
    const display = stringDisplayNode({ sliceEnd: 4, sliceStart: 1 });
    const decoded = getNodeCodec([stringTypeNode('utf8', { display })]).decode(getUtf8Encoder().encode('abcdefg'));
    expect(formatString(decoded)).toBe('bcd');
});

test('it slices strings by code points', () => {
    const display = stringDisplayNode({ sliceEnd: 1 });
    const decoded = getNodeCodec([stringTypeNode('utf8', { display })]).decode(getUtf8Encoder().encode('👋hi'));
    expect(formatString(decoded)).toBe('👋');
});

test('it starts string slices after characters made of several code units', () => {
    const display = stringDisplayNode({ sliceStart: 1 });
    const decoded = getNodeCodec([stringTypeNode('utf8', { display })]).decode(getUtf8Encoder().encode('👋hi'));
    expect(formatString(decoded)).toBe('hi');
});
