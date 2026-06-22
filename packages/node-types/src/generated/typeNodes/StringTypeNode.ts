import type { StringDisplayNode } from '../displayNodes/StringDisplayNode';
import type { BytesEncoding } from '../shared/bytesEncoding';

/**
 * A string value.
 * The encoding describes how its bytes are written.
 * The byte length is determined by an enclosing wrapper such as `sizePrefixTypeNode` or `fixedSizeTypeNode`.
 */
export interface StringTypeNode<
    TEncoding extends BytesEncoding = BytesEncoding,
    TDisplay extends StringDisplayNode | undefined = StringDisplayNode | undefined,
> {
    readonly kind: 'stringTypeNode';

    // Data.
    /** The byte encoding used to serialise the string. */
    readonly encoding: TEncoding;

    // Children.
    /** Display metadata describing how the string is presented. */
    readonly display?: TDisplay;
}
