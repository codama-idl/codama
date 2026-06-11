import type { BytesEncoding } from '../shared/bytesEncoding';

/**
 * A string value.
 * The encoding describes how its bytes are written.
 * The byte length is determined by an enclosing wrapper such as `sizePrefixTypeNode` or `fixedSizeTypeNode`.
 */
export interface StringTypeNode<TEncoding extends BytesEncoding = BytesEncoding> {
    readonly kind: 'stringTypeNode';

    // Data.
    /** The byte encoding used to serialise the string. */
    readonly encoding: TEncoding;
}
