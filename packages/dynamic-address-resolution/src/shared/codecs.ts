import { getAddressEncoder } from '@solana/addresses';
import type { Encoder } from '@solana/codecs';
import {
    getBase16Codec,
    getBase58Codec,
    getBase64Codec,
    getBooleanEncoder,
    getUtf8Codec,
    getUtf8Encoder,
} from '@solana/codecs';

// Memoized encoders and codecs to avoid unnecessary re-instantiation.

let addressEncoder: ReturnType<typeof getAddressEncoder> | undefined;
export function getMemoizedAddressEncoder() {
    if (!addressEncoder) addressEncoder = getAddressEncoder();
    return addressEncoder;
}

let utf8Encoder: ReturnType<typeof getUtf8Encoder> | undefined;
export function getMemoizedUtf8Encoder() {
    if (!utf8Encoder) utf8Encoder = getUtf8Encoder();
    return utf8Encoder;
}

let booleanEncoder: Encoder<boolean> | undefined;
export function getMemoizedBooleanEncoder() {
    if (!booleanEncoder) booleanEncoder = getBooleanEncoder();
    return booleanEncoder;
}

let utf8Codec: ReturnType<typeof getUtf8Codec> | undefined;
export function getMemoizedUtf8Codec() {
    if (!utf8Codec) utf8Codec = getUtf8Codec();
    return utf8Codec;
}

let base16Codec: ReturnType<typeof getBase16Codec> | undefined;
export function getMemoizedBase16Codec() {
    if (!base16Codec) base16Codec = getBase16Codec();
    return base16Codec;
}

let base58Codec: ReturnType<typeof getBase58Codec> | undefined;
export function getMemoizedBase58Codec() {
    if (!base58Codec) base58Codec = getBase58Codec();
    return base58Codec;
}

let base64Codec: ReturnType<typeof getBase64Codec> | undefined;
export function getMemoizedBase64Codec() {
    if (!base64Codec) base64Codec = getBase64Codec();
    return base64Codec;
}
