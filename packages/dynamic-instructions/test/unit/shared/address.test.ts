import { type Address, address } from '@solana/addresses';
import { describe, expect, expectTypeOf, test } from 'vitest';

import {
    type AddressInput,
    isConvertibleAddress,
    isPublicKeyLike,
    type PublicKeyLike,
    toAddress,
} from '../../../src/shared/address';
import { SvmTestContext } from '../../svm-test-context';

describe('isPublicKeyLike', () => {
    test('should return true for objects with toBase58 method', () => {
        const publicKey = { toBase58: () => '11111111111111111111111111111111' };
        expect(isPublicKeyLike(publicKey)).toBe(true);
    });

    test('should narrow type to PublicKeyLike', () => {
        const value: unknown = { toBase58: () => '11111111111111111111111111111111' };
        if (isPublicKeyLike(value)) {
            expectTypeOf(value).toExtend<PublicKeyLike>();
        }
    });

    test('should return false for plain strings', () => {
        expect(isPublicKeyLike('11111111111111111111111111111111')).toBe(false);
    });

    test('should return false for null', () => {
        expect(isPublicKeyLike(null)).toBe(false);
    });

    test('should return false for undefined', () => {
        expect(isPublicKeyLike(undefined)).toBe(false);
    });

    test('should return false for numbers', () => {
        expect(isPublicKeyLike(42)).toBe(false);
    });

    test('should return false for objects without toBase58', () => {
        expect(isPublicKeyLike({ toString: () => 'hello' })).toBe(false);
    });

    test('should return false for objects where toBase58 is not a function', () => {
        expect(isPublicKeyLike({ toBase58: 'not-a-function' })).toBe(false);
    });
});

describe('toAddress', () => {
    const VALID_ADDRESS = '11111111111111111111111111111111';

    test('should convert a string to Address', () => {
        const result = toAddress(VALID_ADDRESS);
        expect(result).toBe(VALID_ADDRESS);
        expectTypeOf(result).toExtend<Address>();
    });

    test('should convert a PublicKeyLike to Address', () => {
        const publicKey = { toBase58: () => VALID_ADDRESS };
        const result = toAddress(publicKey);
        expect(result).toBe(VALID_ADDRESS);
    });

    test('should pass through an existing Address', () => {
        const addr = address(VALID_ADDRESS);
        const result = toAddress(addr);
        expect(result).toBe(VALID_ADDRESS);
    });

    test('should throw for invalid non-string or pubkey Addresses', () => {
        const invalidAddresses = [42n, 42, { a: 42 }, null, undefined];
        for (const input of invalidAddresses) {
            // @ts-expect-error testing invalid inputs
            expect(() => toAddress(input)).toThrow(/Cannot convert value to Address/);
        }
    });
});

describe('isConvertibleAddress', () => {
    test('should return true for Address', () => {
        const address = SvmTestContext.generateAddress();
        expect(isConvertibleAddress(address)).toBe(true);
    });

    test('should return true for PublicKeyLike', () => {
        const publicKey = { toBase58: () => SvmTestContext.generateAddress() };
        const result = toAddress(publicKey);
        expect(isConvertibleAddress(result)).toBe(true);
    });

    test('should return true for valid base58 string', () => {
        const addr = '11111111111111111111111111111111';
        const result = toAddress(addr);
        expect(isConvertibleAddress(result)).toBe(true);
    });

    test('should return false for invalid string', () => {
        const addr = 'invalid_address';
        expect(isConvertibleAddress(addr)).toBe(false);
    });

    test('should return false for null and undefined', () => {
        [null, undefined].forEach(invalidAddr => {
            expect(isConvertibleAddress(invalidAddr)).toBe(false);
        });
    });

    test('should return false for invalid objects', () => {
        [{}, { a: 42 }].forEach(invalidAddr => {
            expect(isConvertibleAddress(invalidAddr)).toBe(false);
        });
    });
});

describe('AddressInput type', () => {
    test('should accept Address', () => {
        expectTypeOf(address('11111111111111111111111111111111')).toExtend<AddressInput>();
    });

    test('should accept string', () => {
        expectTypeOf<string>().toExtend<AddressInput>();
    });

    test('should accept PublicKeyLike', () => {
        expectTypeOf<PublicKeyLike>().toExtend<AddressInput>();
    });
});
