import { describe, expect, test } from 'vitest';

import { getCodecFromBytesEncoding, isUint8Array, uint8ArrayToEncodedString } from '../../../src/shared/bytes-encoding';

describe('uint8ArrayToEncodedString', () => {
    const helloBytes = new Uint8Array([72, 101, 108, 108, 111]);

    test('should encode to base16', () => {
        expect(uint8ArrayToEncodedString(helloBytes, 'base16')).toBe('48656c6c6f');
    });

    test('should encode to base58', () => {
        expect(uint8ArrayToEncodedString(helloBytes, 'base58')).toBe('9Ajdvzr');
    });

    test('should encode to base64', () => {
        expect(uint8ArrayToEncodedString(helloBytes, 'base64')).toBe('SGVsbG8=');
    });

    test('should encode to utf8', () => {
        expect(uint8ArrayToEncodedString(helloBytes, 'utf8')).toBe('Hello');
    });

    test('should handle empty bytes', () => {
        expect(uint8ArrayToEncodedString(new Uint8Array(), 'base16')).toBe('');
    });
});

describe('getCodecFromBytesEncoding', () => {
    test('should return codec for base16', () => {
        const codec = getCodecFromBytesEncoding('base16');
        expect(codec).toBeDefined();
        expect(codec.encode('ff')).toEqual(new Uint8Array([255]));
    });

    test('should return codec for base58', () => {
        const codec = getCodecFromBytesEncoding('base58');
        expect(codec).toBeDefined();
    });

    test('should return codec for base64', () => {
        const codec = getCodecFromBytesEncoding('base64');
        expect(codec).toBeDefined();
    });

    test('should return codec for utf8', () => {
        const codec = getCodecFromBytesEncoding('utf8');
        expect(codec).toBeDefined();
        expect(codec.encode('Hi')).toEqual(new Uint8Array([72, 105]));
    });

    test('should throw for unsupported encoding', () => {
        // @ts-expect-error testing invalid input
        expect(() => getCodecFromBytesEncoding('rot13')).toThrow(/Unrecognized bytes encoding \[.*rot13.*\]/);
    });
});

describe('isUint8Array', () => {
    test('should return true for Uint8Array', () => {
        expect(isUint8Array(new Uint8Array([1, 2, 3]))).toBe(true);
        expect(isUint8Array(new Uint8Array())).toBe(true);
    });

    test('should return false for regular arrays', () => {
        expect(isUint8Array([1, 2, 3])).toBe(false);
    });

    test('should return false for strings', () => {
        expect(isUint8Array('hello')).toBe(false);
    });

    test('should return false for null and undefined', () => {
        expect(isUint8Array(null)).toBe(false);
        expect(isUint8Array(undefined)).toBe(false);
    });

    test('should return false for other typed arrays', () => {
        expect(isUint8Array(new Uint16Array([1, 2]))).toBe(false);
        expect(isUint8Array(new Int8Array([1, 2]))).toBe(false);
    });
});
