import type { BytesEncoding, StringTypeNode } from '@codama/node-types';

/**
 * A string value.
 * The encoding describes how its bytes are written.
 * The byte length is determined by an enclosing wrapper such as `sizePrefixTypeNode` or `fixedSizeTypeNode`.
 */
export function stringTypeNode<const TEncoding extends BytesEncoding = BytesEncoding>(
    encoding: TEncoding,
): StringTypeNode<TEncoding> {
    return Object.freeze({
        kind: 'stringTypeNode',

        // Data.
        encoding,
    });
}
