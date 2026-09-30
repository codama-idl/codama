import {
    CODAMA_ERROR__DYNAMIC_CLIENT__CANNOT_CONVERT_TO_ADDRESS,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import { address, isAddress } from '@solana/addresses';

import { formatValueType, safeStringify } from './util';

/**
 * Accept both modern Address strings and legacy PublicKey-like objects.
 * We intentionally use duck-typing to avoid hard dependency on @solana/web3.js types.
 */
export type PublicKeyLike = { toBase58(): string };

export type AddressInput = Address | PublicKeyLike | string;

export function isPublicKeyLike(value: unknown): value is PublicKeyLike {
    const obj = value as Record<string, unknown>;
    return typeof value === 'object' && value !== null && 'toBase58' in obj && typeof obj.toBase58 === 'function';
}

export function toAddress(input: AddressInput): Address {
    if (isPublicKeyLike(input)) return address(input.toBase58());
    if (typeof input === 'string' && isAddress(input)) return address(input);

    throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__CANNOT_CONVERT_TO_ADDRESS, {
        value: safeStringify(input),
    });
}

/**
 * Convert a value to the address of the given account, throwing
 * `UNEXPECTED_ADDRESS_TYPE` when it is not address convertible. The account
 * name may locate an item of remaining accounts, e.g. `signers[1]`.
 */
export function toAddressOrThrow(value: unknown, accountName: string): Address {
    if (!isAddressConvertible(value)) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, {
            accountName,
            actualType: formatValueType(value),
            expectedType: 'Address | PublicKey',
        });
    }
    return toAddress(value);
}

export function isAddressConvertible(value: unknown): value is AddressInput {
    if (value == null) return false;
    return isPublicKeyLike(value) || (typeof value === 'string' && isAddress(value));
}
