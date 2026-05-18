import { CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING, CodamaError } from '@codama/errors';
import type { BytesEncoding } from 'codama';

import { getMemoizedBase16Codec, getMemoizedBase58Codec, getMemoizedBase64Codec, getMemoizedUtf8Codec } from './codecs';
import { safeStringify } from './util';

/**
 * Converts Uint8Array to encoded string based on encoding type.
 * Uses @solana/codecs encoders internally for consistent encoding/decoding.
 */
export function uint8ArrayToEncodedString(bytes: Uint8Array, encoding: BytesEncoding): string {
    const codec = getCodecFromBytesEncoding(encoding);
    return codec.decode(bytes);
}

/**
 * Gets the appropriate codec for a given bytes encoding format.
 */
export function getCodecFromBytesEncoding(encoding: BytesEncoding) {
    switch (encoding) {
        case 'base16':
            return getMemoizedBase16Codec();
        case 'base58':
            return getMemoizedBase58Codec();
        case 'base64':
            return getMemoizedBase64Codec();
        case 'utf8':
            return getMemoizedUtf8Codec();
        default:
            throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING, {
                encoding: safeStringify(encoding as unknown),
            });
    }
}
/**
 * Type guard to check if a value is a Uint8Array.
 */
export function isUint8Array(value: unknown): value is Uint8Array {
    return value instanceof Uint8Array;
}
