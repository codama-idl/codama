import type { BytesEncoding, BytesValueNode } from '@codama/node-types';

export function bytesValueNode(encoding: BytesEncoding, data: string): BytesValueNode {
    return Object.freeze({
        kind: 'bytesValueNode',

        // Data.
        data,
        encoding,
    });
}
