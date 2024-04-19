import type { BytesEncoding } from '../shared';

export interface StringTypeNode<TEncoding extends BytesEncoding = BytesEncoding> {
    readonly kind: 'stringTypeNode';

    // Data.
    readonly encoding: TEncoding;
}
