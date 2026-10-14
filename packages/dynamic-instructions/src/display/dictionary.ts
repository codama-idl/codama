import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { EncodedAccount } from '@solana/accounts';
import { type Address, getAddressDecoder, getAddressEncoder } from '@solana/addresses';
import {
    addDecoderSizePrefix,
    addEncoderSizePrefix,
    type Codec,
    combineCodec,
    type Decoder,
    type Encoder,
    getBooleanDecoder,
    getBooleanEncoder,
    getBytesDecoder,
    getBytesEncoder,
    getMapDecoder,
    getMapEncoder,
    getStructDecoder,
    getStructEncoder,
    getU32Decoder,
    getU32Encoder,
    getU64Decoder,
    getU64Encoder,
    getUtf8Decoder,
    getUtf8Encoder,
    transformDecoder,
    transformEncoder,
} from '@solana/codecs';
import { getLinkablesFromNode, type LinkableDictionary, type RootNode } from 'codama';

import { createAccountReader } from './accounts';
import { displayInstruction } from './display-instruction';
import type { DisplayAccountMap, DisplayDictionary, DisplayNamedMap, FetchMaybeAccountsFn } from './types';

/**
 * Fetch the accounts the display of a parsed instruction reads, e.g. a mint for the `decimals` of
 * an amount, into a {@link DisplayAccountMap}. Accounts are fetched in rounds, each in a single
 * call to `fetchAccounts`, since reading an account can reveal the next one to read, e.g. the
 * mint of a token account for `${accounts.source.data.mint.decimals}`. Accounts that do not exist
 * are left out, and so the values read from them are not presented.
 *
 * Use the map with `getInstructionDisplayFromParsedInstruction`, or within a
 * {@link DisplayDictionary}, e.g. to display the instruction offline.
 *
 * @example
 * ```ts
 * const parsed = parseInstruction(root, instruction);
 * const accounts = await getDisplayAccountMap(root, parsed, addresses => fetchEncodedAccounts(rpc, addresses));
 * const display = getInstructionDisplayFromParsedInstruction(root, parsed, { accounts });
 * ```
 */
export async function getDisplayAccountMap(
    root: RootNode,
    parsed: ParsedInstruction,
    fetchAccounts: FetchMaybeAccountsFn,
    options: { accounts?: DisplayAccountMap; linkables?: LinkableDictionary } = {},
): Promise<DisplayAccountMap> {
    const linkables = options.linkables ?? getLinkablesFromNode(root);
    const accounts = new Map(options.accounts);
    const requested = new Set<Address>();
    for (;;) {
        // Displaying with the accounts fetched so far reveals the ones it still reads.
        const missing = new Set<Address>();
        const readAccount = createAccountReader(accounts, linkables, address => {
            if (!requested.has(address)) missing.add(address);
        });
        displayInstruction({ formatOptions: {}, linkables, parsed, readAccount });
        if (missing.size === 0) return accounts;

        const addresses = [...missing];
        addresses.forEach(address => requested.add(address));
        for (const account of await fetchAccounts(addresses)) {
            if (!account.exists) continue;
            const { address, data, executable, lamports, programAddress, space } = account;
            accounts.set(address, { address, data, executable, lamports, programAddress, space });
        }
    }
}

// An `EncodedAccount` minus its address, which is carried as the map key.
type AccountBody = Omit<EncodedAccount, 'address'>;

const accountBodyEncoder = (): Encoder<AccountBody> =>
    getStructEncoder([
        ['data', addEncoderSizePrefix(getBytesEncoder(), getU32Encoder())],
        ['executable', getBooleanEncoder()],
        ['lamports', getU64Encoder()],
        ['programAddress', getAddressEncoder()],
        ['space', getU64Encoder()],
    ]);
const accountBodyDecoder = (): Decoder<AccountBody> =>
    getStructDecoder([
        ['data', addDecoderSizePrefix(getBytesDecoder(), getU32Decoder())],
        ['executable', getBooleanDecoder()],
        ['lamports', getU64Decoder() as Decoder<EncodedAccount['lamports']>],
        ['programAddress', getAddressDecoder()],
        ['space', getU64Decoder()],
    ]);

/** Encoder for a {@link DisplayAccountMap}, keyed by address with the account body as the value. */
export function getDisplayAccountMapEncoder(): Encoder<DisplayAccountMap> {
    return transformEncoder(
        getMapEncoder(getAddressEncoder(), accountBodyEncoder(), { size: getU32Encoder() }),
        (map: DisplayAccountMap) => new Map(map),
    );
}

/** Decoder for a {@link DisplayAccountMap}. Re-attaches each entry's address onto its account body. */
export function getDisplayAccountMapDecoder(): Decoder<DisplayAccountMap> {
    return transformDecoder(
        getMapDecoder(getAddressDecoder(), accountBodyDecoder(), { size: getU32Decoder() }),
        bodies =>
            new Map(
                [...bodies].map(([address, body]) => [
                    address,
                    { ...body, address, data: body.data as Uint8Array } satisfies EncodedAccount,
                ]),
            ),
    );
}

/** Codec for a {@link DisplayAccountMap}. */
export function getDisplayAccountMapCodec(): Codec<DisplayAccountMap> {
    return combineCodec(getDisplayAccountMapEncoder(), getDisplayAccountMapDecoder());
}

/** Encoder for a {@link DisplayNamedMap}, keyed by address with a length-prefixed UTF-8 name. */
export function getDisplayNamedMapEncoder(): Encoder<DisplayNamedMap> {
    return transformEncoder(
        getMapEncoder(getAddressEncoder(), addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder()), {
            size: getU32Encoder(),
        }),
        (map: DisplayNamedMap) => new Map(map),
    );
}

/** Decoder for a {@link DisplayNamedMap}. */
export function getDisplayNamedMapDecoder(): Decoder<DisplayNamedMap> {
    return getMapDecoder(getAddressDecoder(), addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder()), {
        size: getU32Decoder(),
    });
}

/** Codec for a {@link DisplayNamedMap}. */
export function getDisplayNamedMapCodec(): Codec<DisplayNamedMap> {
    return combineCodec(getDisplayNamedMapEncoder(), getDisplayNamedMapDecoder());
}

/** Encoder for a {@link DisplayDictionary}, composed from the two map encoders. */
export function getDisplayDictionaryEncoder(): Encoder<DisplayDictionary> {
    return getStructEncoder([
        ['accounts', getDisplayAccountMapEncoder()],
        ['names', getDisplayNamedMapEncoder()],
    ]);
}

/** Decoder for a {@link DisplayDictionary}, composed from the two map decoders. */
export function getDisplayDictionaryDecoder(): Decoder<DisplayDictionary> {
    return getStructDecoder([
        ['accounts', getDisplayAccountMapDecoder()],
        ['names', getDisplayNamedMapDecoder()],
    ]);
}

/** Codec for a {@link DisplayDictionary}. */
export function getDisplayDictionaryCodec(): Codec<DisplayDictionary> {
    return combineCodec(getDisplayDictionaryEncoder(), getDisplayDictionaryDecoder());
}
