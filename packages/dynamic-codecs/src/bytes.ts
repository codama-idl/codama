import { CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING, CodamaError } from '@codama/errors';
import { BytesEncoding } from '@codama/nodes';
import { getBase16Codec, getBase58Codec, getBase64Codec, getUtf8Codec } from '@solana/codecs';

/** The codec of a bytes encoding, e.g. a base58 codec for `'base58'`. */
export function getCodecFromBytesEncoding(encoding: BytesEncoding) {
    switch (encoding) {
        case 'base16':
            return getBase16Codec();
        case 'base58':
            return getBase58Codec();
        case 'base64':
            return getBase64Codec();
        case 'utf8':
            return getUtf8Codec();
        default:
            throw new CodamaError(CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING, {
                encoding: encoding satisfies never,
            });
    }
}
