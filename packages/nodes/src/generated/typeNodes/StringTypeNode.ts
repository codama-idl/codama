import type { BytesEncoding, StringDisplayNode, StringTypeNode } from '@codama/node-types';

/**
 * A string value.
 * The encoding describes how its bytes are written.
 * The byte length is determined by an enclosing wrapper such as `sizePrefixTypeNode` or `fixedSizeTypeNode`.
 */
export function stringTypeNode<
    const TEncoding extends BytesEncoding = BytesEncoding,
    const TDisplay extends StringDisplayNode | undefined = undefined,
>(
    encoding: TEncoding,
    options: {
        display?: TDisplay;
    } = {},
): StringTypeNode<TEncoding, TDisplay> {
    return Object.freeze({
        kind: 'stringTypeNode',

        // Data.
        encoding,

        // Children.
        ...(options.display !== undefined && { display: options.display }),
    });
}
