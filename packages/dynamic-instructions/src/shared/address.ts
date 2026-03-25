import type { Address } from '@solana/addresses';
import { address, isAddress } from '@solana/addresses';

import { DynamicInstructionsError } from './errors';
import { safeStringify } from './util';

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
    if (typeof input === 'string') return address(input);

    throw new DynamicInstructionsError(`Cannot convert value to Address: ${safeStringify(input)}.`);
}

export function isConvertibleAddress(value: unknown): value is AddressInput {
    if (value == null) return false;
    return isPublicKeyLike(value) || (typeof value === 'string' && isAddress(value));
}
