import { getBase16Codec, getBase58Codec, getUtf8Codec } from '@solana/codecs';
import { fixedSizeTypeNode, stringTypeNode, stringValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './default-value-encoder-test-utils';

describe('default-value-encoder: visitStringValue', () => {
    test('should encode utf8 string', () => {
        const visitor = makeVisitor(fixedSizeTypeNode(stringTypeNode('utf8'), 5));
        const result = visitor.visitStringValue(stringValueNode('hello'));
        expect(result).toEqual(getUtf8Codec().encode('hello'));
    });

    test('should encode base16 string', () => {
        const visitor = makeVisitor(fixedSizeTypeNode(stringTypeNode('base16'), 4));
        const result = visitor.visitStringValue(stringValueNode('deadbeef'));
        expect(result).toEqual(getBase16Codec().encode('deadbeef'));
    });

    test('should encode base58 string', () => {
        const visitor = makeVisitor(fixedSizeTypeNode(stringTypeNode('base58'), 3));
        const result = visitor.visitStringValue(stringValueNode('abc'));
        expect(result).toEqual(getBase58Codec().encode('abc'));
    });

    test('should encode empty string', () => {
        const visitor = makeVisitor(fixedSizeTypeNode(stringTypeNode('utf8'), 0));
        const result = visitor.visitStringValue(stringValueNode(''));
        expect(result).toEqual(getUtf8Codec().encode(''));
    });
});
