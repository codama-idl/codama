import { CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, CodamaError } from '@codama/errors';
import { type Address, address } from '@solana/addresses';
import { instructionAccountNode, instructionNode, instructionRemainingAccountsNode } from 'codama';
import { describe, expect, expectTypeOf, test } from 'vitest';

import {
    type AddressInput,
    isAddressConvertible,
    isPublicKeyLike,
    type PublicKeyLike,
    toAddress,
    toAddressOrThrow,
} from '../../src/shared/address';
import { generateAddress } from '../test-utils';

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

describe('toAddressOrThrow', () => {
    test('should convert address convertible values', () => {
        const addr = '11111111111111111111111111111111';
        expect(toAddressOrThrow(addr, [])).toBe(addr);
    });

    test('should throw with the given path for values that are not address convertible', () => {
        const account = instructionAccountNode({ identifier: 'mint', isSigner: false, isWritable: false });
        const path = [instructionNode({ accounts: [account], identifier: 'myInstruction' }), account];
        expect(() => toAddressOrThrow(42, path)).toThrow(
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, {
                actualType: 'number',
                expectedType: 'Address | PublicKey',
                path,
            }),
        );
    });

    test('should throw with the given index for list items that are not address convertible', () => {
        const remainingAccounts = instructionRemainingAccountsNode('signers');
        const instruction = instructionNode({ identifier: 'myInstruction', remainingAccounts: [remainingAccounts] });
        const path = [instruction, remainingAccounts];
        expect(() => toAddressOrThrow(42, path, 1)).toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ index: 1, path }),
            }),
        );
    });
});

describe('isAddressConvertible', () => {
    test('should return true for Address', async () => {
        const address = await generateAddress();
        expect(isAddressConvertible(address)).toBe(true);
    });

    test('should return true for PublicKeyLike', () => {
        const publicKey = { toBase58: () => '11111111111111111111111111111111' };
        const result = toAddress(publicKey);
        expect(isAddressConvertible(result)).toBe(true);
    });

    test('should return true for valid base58 string', () => {
        const addr = '11111111111111111111111111111111';
        const result = toAddress(addr);
        expect(isAddressConvertible(result)).toBe(true);
    });

    test('should return false for invalid string', () => {
        const addr = 'invalid_address';
        expect(isAddressConvertible(addr)).toBe(false);
    });

    test('should return false for null and undefined', () => {
        [null, undefined].forEach(invalidAddr => {
            expect(isAddressConvertible(invalidAddr)).toBe(false);
        });
    });

    test('should return false for invalid objects', () => {
        [{}, { a: 42 }].forEach(invalidAddr => {
            expect(isAddressConvertible(invalidAddr)).toBe(false);
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
