import { publicKeyTypeNode } from '@codama/nodes';
import { Address, address, getAddressEncoder } from '@solana/addresses';
import { expect, test } from 'vitest';

import { formatPublicKey, getNodeCodec } from '../../src';

const USDC = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const decoded = getNodeCodec([publicKeyTypeNode()]).decode(getAddressEncoder().encode(USDC));

test('it formats public keys as their address', () => {
    expect(formatPublicKey(decoded)).toBe(USDC);
});

test('it formats public keys with the given address formatter', () => {
    const names = new Map<Address, string>([[USDC, 'USDC']]);
    expect(formatPublicKey(decoded, { formatAddress: address => names.get(address) ?? address })).toBe('USDC');
});

test('it formats public keys with both their name and their truncated address', () => {
    const formatAddress = (address: string) => `USDC (${address.slice(0, 4)}…${address.slice(-4)})`;
    expect(formatPublicKey(decoded, { formatAddress })).toBe('USDC (EPjF…Dt1v)');
});
