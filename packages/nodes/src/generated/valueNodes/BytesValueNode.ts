import type { BytesEncoding, BytesValueNode } from '@codama/node-types';

/** A concrete bytes value, encoded as text in the chosen encoding. */
export function bytesValueNode(encoding: BytesEncoding, data: string): BytesValueNode {
    return Object.freeze({
        kind: 'bytesValueNode',

        // Data.
        data,
        encoding,
    });
}
