import { describe, expect, test } from 'vitest';

import { toAddress } from '../../../src';
import {
    getMemoizedAddressEncoder,
    getMemoizedBase16Codec,
    getMemoizedBase58Codec,
    getMemoizedBase64Codec,
    getMemoizedBooleanEncoder,
    getMemoizedUtf8Codec,
    getMemoizedUtf8Encoder,
} from '../../../src/shared/codecs';
import { SvmTestContext } from '../../svm-test-context';

describe('shared codecs (memoized):', () => {
    test('should encode a base58 address to 32 bytes (getMemoizedAddressEncoder)', () => {
        const kp = SvmTestContext.generateKeypair();
        const encoder = getMemoizedAddressEncoder();
        const result = encoder.encode(toAddress(kp.publicKey));
        expect(result).toEqual(kp.publicKey.toBytes());
    });

    test('should encode a string to utf8 bytes (getMemoizedUtf8Encoder)', () => {
        const encoder = getMemoizedUtf8Encoder();
        expect(encoder.encode('Hello')).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    test('should encode true to a single byte (getMemoizedBooleanEncoder)', () => {
        const encoder = getMemoizedBooleanEncoder();
        expect(encoder.encode(true)).toEqual(new Uint8Array([1]));
    });

    test('should encode a string to utf8 bytes (getMemoizedUtf8Codec)', () => {
        const codec = getMemoizedUtf8Codec();
        expect(codec.encode('Hi')).toEqual(new Uint8Array([72, 105]));
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
