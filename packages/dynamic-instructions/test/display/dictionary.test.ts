import type { EncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import { describe, expect, test } from 'vitest';

import {
    type DisplayAccountMap,
    type DisplayDictionary,
    type DisplayNamedMap,
    getDisplayAccountMapCodec,
    getDisplayAccountMapDecoder,
    getDisplayAccountMapEncoder,
    getDisplayDictionaryCodec,
    getDisplayDictionaryDecoder,
    getDisplayDictionaryEncoder,
    getDisplayNamedMapCodec,
    getDisplayNamedMapDecoder,
    getDisplayNamedMapEncoder,
} from '../../src';

const MINT = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY' as Address;
const OWNER = '3Wnd5Df69KitZfUoPYZU438eFRNwGHkhLnSAWL65PxJX' as Address;
const PROGRAM = '11111111111111111111111111111111' as Address;

/** An account carrying the given bytes and simple metadata. */
function makeEncodedAccount(address: Address, data: Uint8Array): EncodedAccount {
    return {
        address,
        data,
        executable: false,
        lamports: 42n as EncodedAccount['lamports'],
        programAddress: PROGRAM,
        space: BigInt(data.length),
    };
}

describe('getDisplayAccountMapCodec', () => {
    test('it round-trips an account map, preserving bytes and metadata', () => {
        // Given a map with two accounts, one carrying multi-byte data.
        const map: DisplayAccountMap = new Map([
            [MINT, makeEncodedAccount(MINT, new Uint8Array([6, 255, 0, 128]))],
            [OWNER, makeEncodedAccount(OWNER, new Uint8Array([]))],
        ]);

        // When we encode then decode it.
        const codec = getDisplayAccountMapCodec();
        const decoded = codec.decode(codec.encode(map));

        // Then it reproduces both entries faithfully.
        expect(decoded.get(MINT)).toEqual(map.get(MINT));
        expect(decoded.get(OWNER)).toEqual(map.get(OWNER));
    });

    test('it round-trips an empty account map', () => {
        const codec = getDisplayAccountMapCodec();
        const decoded = codec.decode(codec.encode(new Map()));
        expect(decoded.size).toBe(0);
    });

    test('its standalone encoder and decoder interoperate', () => {
        // Given the split encoder/decoder rather than the combined codec.
        const map: DisplayAccountMap = new Map([[MINT, makeEncodedAccount(MINT, new Uint8Array([1, 2, 3]))]]);

        // When we encode with the encoder and decode with the decoder.
        const decoded = getDisplayAccountMapDecoder().decode(getDisplayAccountMapEncoder().encode(map));

        // Then the split halves agree with the combined codec.
        expect(decoded.get(MINT)).toEqual(map.get(MINT));
    });
});

describe('getDisplayNamedMapCodec', () => {
    test('it round-trips names including multi-byte UTF-8', () => {
        // Given a domain name and a multi-byte token symbol.
        const map: DisplayNamedMap = new Map([
            [OWNER, 'toly.sol'],
            [MINT, 'USD₮'],
        ]);

        // When we encode then decode it.
        const codec = getDisplayNamedMapCodec();
        const decoded = codec.decode(codec.encode(map));

        // Then both names survive intact.
        expect(decoded.get(OWNER)).toBe('toly.sol');
        expect(decoded.get(MINT)).toBe('USD₮');
    });

    test('it round-trips an empty named map', () => {
        const codec = getDisplayNamedMapCodec();
        const decoded = codec.decode(codec.encode(new Map()));
        expect(decoded.size).toBe(0);
    });

    test('its standalone encoder and decoder interoperate', () => {
        const map: DisplayNamedMap = new Map([[OWNER, 'toly.sol']]);
        const decoded = getDisplayNamedMapDecoder().decode(getDisplayNamedMapEncoder().encode(map));
        expect(decoded.get(OWNER)).toBe('toly.sol');
    });
});

describe('getDisplayDictionaryCodec', () => {
    test('it round-trips a full dictionary composed of both maps', () => {
        // Given a dictionary carrying an account map and a named map.
        const dictionary: DisplayDictionary = {
            accounts: new Map([[MINT, makeEncodedAccount(MINT, new Uint8Array([6]))]]),
            names: new Map([[OWNER, 'toly.sol']]),
        };

        // When we encode then decode it.
        const codec = getDisplayDictionaryCodec();
        const decoded = codec.decode(codec.encode(dictionary));

        // Then both maps are reproduced.
        expect(decoded.accounts.get(MINT)).toEqual(dictionary.accounts.get(MINT));
        expect(decoded.names.get(OWNER)).toBe('toly.sol');
    });

    test('its standalone encoder and decoder interoperate', () => {
        const dictionary: DisplayDictionary = {
            accounts: new Map([[MINT, makeEncodedAccount(MINT, new Uint8Array([9]))]]),
            names: new Map([[OWNER, 'toly.sol']]),
        };
        const decoded = getDisplayDictionaryDecoder().decode(getDisplayDictionaryEncoder().encode(dictionary));
        expect(decoded.accounts.get(MINT)).toEqual(dictionary.accounts.get(MINT));
        expect(decoded.names.get(OWNER)).toBe('toly.sol');
    });
});
