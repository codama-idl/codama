import { getBase16Codec, getBase58Codec, getUtf8Codec } from '@solana/codecs';
import { bytesTypeNode, bytesValueNode, fixedSizeTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './default-value-encoder-test-utils';

describe('default-value-encoder: visitBytesValue', () => {
    test('should encode base16 bytes', () => {
        const visitor = makeVisitor(fixedSizeTypeNode(bytesTypeNode(), 4));
        const result = visitor.visitBytesValue(bytesValueNode('base16', 'deadbeef'));
        expect(result).toEqual(getBase16Codec().encode('deadbeef'));
    });

    test('should encode base58 bytes', async () => {
        const bs58 = await SvmTestContext.generateAddress();
        const visitor = makeVisitor(fixedSizeTypeNode(bytesTypeNode(), 32));
        const result = visitor.visitBytesValue(bytesValueNode('base58', bs58));
        expect(result).toEqual(getBase58Codec().encode(bs58));
    });

    test('should encode utf8 bytes', () => {
        const visitor = makeVisitor(fixedSizeTypeNode(bytesTypeNode(), 5));
        const result = visitor.visitBytesValue(bytesValueNode('utf8', 'hello'));
        expect(result).toEqual(getUtf8Codec().encode('hello'));
    });

    test('should encode empty bytes', () => {
        const visitor = makeVisitor(fixedSizeTypeNode(bytesTypeNode(), 0));
        const result = visitor.visitBytesValue(bytesValueNode('base16', ''));
        expect(result).toEqual(new Uint8Array(0));
    });
});
