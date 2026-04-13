import { getU8Codec, getU32Codec } from '@solana/codecs';
import { numberTypeNode, numberValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './default-value-encoder-test-utils';

describe('default-value-encoder: visitNumberValue', () => {
    test('should encode u8 value', () => {
        const visitor = makeVisitor(numberTypeNode('u8'));
        const result = visitor.visitNumberValue(numberValueNode(42));
        expect(result).toEqual(getU8Codec().encode(42));
    });

    test('should encode zero', () => {
        const visitor = makeVisitor(numberTypeNode('u8'));
        const result = visitor.visitNumberValue(numberValueNode(0));
        expect(result).toEqual(getU8Codec().encode(0));
    });

    test('should encode u32 value', () => {
        const visitor = makeVisitor(numberTypeNode('u32'));
        const result = visitor.visitNumberValue(numberValueNode(100_000));
        expect(result).toEqual(getU32Codec().encode(100_000));
    });

    test('should encode max u8 value', () => {
        const visitor = makeVisitor(numberTypeNode('u8'));
        const result = visitor.visitNumberValue(numberValueNode(255));
        expect(result).toEqual(getU8Codec().encode(255));
    });

    test('should throw on overflow for u8 value', () => {
        const visitor = makeVisitor(numberTypeNode('u8'));
        expect(() => visitor.visitNumberValue(numberValueNode(1000))).toThrow();
    });
});
