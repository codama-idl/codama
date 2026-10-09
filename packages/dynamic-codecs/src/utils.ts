import { CODAMA_ERROR__UNRECOGNIZED_BYTES_ENCODING, CodamaError } from '@codama/errors';
import { titleCase } from '@codama/fragments/casing';
import { BytesEncoding, getTextNodeContent } from '@codama/nodes';
import { getLastNodeFromPath } from '@codama/visitors-core';
import { getBase16Codec, getBase58Codec, getBase64Codec, getUtf8Codec } from '@solana/codecs';

import type { DecodedEnumVariantTypeNode } from './decoded';

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

/**
 * The label of a decoded enum variant: the label of its display node, or its identifier in
 * title case otherwise, e.g. `"Move To"` for `moveTo`.
 */
export function getEnumVariantLabel(decoded: DecodedEnumVariantTypeNode): string {
    const variant = getLastNodeFromPath(decoded.path);
    const label = variant.display?.label;
    return label === undefined ? titleCase(variant.identifier) : getTextNodeContent(label);
}
