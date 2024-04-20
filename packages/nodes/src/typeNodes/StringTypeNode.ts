import type { BytesEncoding, StringTypeNode } from '@kinobi-so/node-types';

export function stringTypeNode<TEncoding extends BytesEncoding>(encoding: TEncoding): StringTypeNode<TEncoding> {
    return Object.freeze({
        kind: 'stringTypeNode',

        // Data.
        encoding,
    });
}
