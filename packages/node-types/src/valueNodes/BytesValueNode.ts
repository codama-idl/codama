import type { BytesEncoding } from '../shared';

export interface BytesValueNode {
    readonly kind: 'bytesValueNode';

    // Data.
    readonly data: string;
    readonly encoding: BytesEncoding;
}
