import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { EncodedAccount, MaybeEncodedAccount } from '@solana/accounts';
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
import { isNode, type RootNode } from 'codama';

import { buildBaseDisplayContext } from './build-display-context';
import { collectInjectedNodes } from './collect-injected-nodes';
import { resolveInjectionTarget } from './resolve-injection-target';

/**
 * A map from an account address to its fetched on-chain state (Kit's `EncodedAccount`).
 *
 * The offline counterpart of the display layer's `fetchAccount`: a renderer looks addresses up here
 * rather than reaching an RPC. Only accounts that exist are stored, so a missing key means "no data".
 */
export type DisplayAccountMap = ReadonlyMap<Address, EncodedAccount>;

/**
 * A map from an address to a human-readable name.
 *
 * Deliberately generic: a `.sol` domain, token symbol, program label, alias — anything that names an
 * address. It lets an offline renderer present addresses the display layer emits as raw base58.
 */
export type DisplayNamedMap = ReadonlyMap<Address, string>;

/**
 * A serialisable bundle of the external data an offline renderer needs to present an instruction
 * without network access: account state ({@link DisplayAccountMap}) and address names
 * ({@link DisplayNamedMap}).
 */
export type DisplayDictionary = {
    /** Fetched on-chain account state, keyed by address. */
    readonly accounts: DisplayAccountMap;
    /** Human-readable names, keyed by address. */
    readonly names: DisplayNamedMap;
};

/**
 * Fetches multiple on-chain accounts in one call. The batch counterpart of the display layer's
 * `fetchAccount`; wire it to Kit's `fetchEncodedAccounts` for a single `getMultipleAccounts` call.
 */
export type FetchAccountsFn = (addresses: Address[]) => Promise<MaybeEncodedAccount[]>;

/**
 * Computes the addresses whose account state the display layer would fetch to present the given
 * instruction, i.e. the exact set an offline renderer must pre-fetch. Deduplicated, and derived
 * statically from the IDL and parsed instruction with no network access.
 *
 * @see {@link getDisplayAccountMap}
 */
export function getRequiredAccountsForDisplay(root: RootNode, parsedInstruction: ParsedInstruction): Address[] {
    const context = buildBaseDisplayContext(root, parsedInstruction);
    const accountNames = collectInjectedNodes(context).flatMap(node => {
        const target = resolveInjectionTarget(node, context.provides);
        // Only an `accountFieldValueNode` reads account state and therefore triggers a fetch; a bare
        // `accountValueNode` names an existing instruction account and needs none.
        return target && isNode(target, 'accountFieldValueNode') ? [target.account] : [];
    });
    const addresses = accountNames.flatMap(name => {
        const address = parsedInstruction.accounts.find(account => account.name === name)?.address;
        return address ? [address] : [];
    });
    return [...new Set(addresses)];
}

/**
 * Builds the {@link DisplayAccountMap} for an instruction by batch-fetching the accounts its display
 * would read (see {@link getRequiredAccountsForDisplay}). Non-existent accounts are dropped; an empty
 * map is returned when no display value reads account state.
 */
export async function getDisplayAccountMap(
    root: RootNode,
    parsedInstruction: ParsedInstruction,
    fetchAccounts: FetchAccountsFn,
): Promise<DisplayAccountMap> {
    const addresses = getRequiredAccountsForDisplay(root, parsedInstruction);
    if (addresses.length === 0) return new Map();

    const accounts = await fetchAccounts(addresses);
    return new Map(accounts.flatMap(account => (account.exists ? [[account.address, account] as const] : [])));
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
