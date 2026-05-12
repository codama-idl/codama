import { describe, expect, test } from 'vitest';

import {
    getMemoizedAddressEncoder,
    getMemoizedBase16Codec,
    getMemoizedBase58Codec,
    getMemoizedBase64Codec,
    getMemoizedBooleanEncoder,
    getMemoizedUtf8Codec,
    getMemoizedUtf8Encoder,
} from '../../src/shared/codecs';
import { generateAddress } from '../test-utils';

describe('shared codecs (memoized):', () => {
    test('should encode a base58 address to 32 bytes (getMemoizedAddressEncoder)', async () => {
        const addr = await generateAddress();
        const encoder = getMemoizedAddressEncoder();
        const result = encoder.encode(addr);
        expect(result.length).toBe(32);
    });

    test('should encode true to a single byte (getMemoizedBooleanEncoder)', () => {
        const encoder = getMemoizedBooleanEncoder();
        expect(encoder.encode(true)).toEqual(new Uint8Array([1]));
    });

    test.each([
        {
            expected: new Uint8Array([72, 101, 108, 108, 111]),
            getCodec: getMemoizedUtf8Encoder,
            input: 'Hello',
            name: 'getMemoizedUtf8Encoder',
        },
        {
            expected: new Uint8Array([72, 105]),
            getCodec: getMemoizedUtf8Codec,
            input: 'Hi',
            name: 'getMemoizedUtf8Codec',
        },
    ])('should encode a string to utf8 bytes ($name)', ({ getCodec, input, expected }) => {
        expect(getCodec().encode(input)).toEqual(expected);
    });

    test('should encode a hex string to bytes (getMemoizedBase16Codec)', () => {
        const codec = getMemoizedBase16Codec();
        expect(codec.encode('ff')).toEqual(new Uint8Array([255]));
    });

    test('should encode a base58 string to bytes (getMemoizedBase58Codec)', () => {
        const codec = getMemoizedBase58Codec();
        expect(codec.encode('1')).toEqual(new Uint8Array([0]));
    });

    test('should encode a base64 string to bytes (getMemoizedBase64Codec)', () => {
        const codec = getMemoizedBase64Codec();
        expect(codec.encode('AQ==')).toEqual(new Uint8Array([1]));
    });
});
