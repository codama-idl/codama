import type { BytesTypeNode } from '@codama/node-types';

/** A raw sequence of bytes. Typically used inside a fixed-size, size-prefixed, or sentinel-terminated wrapper. */
export function bytesTypeNode(): BytesTypeNode {
    return Object.freeze({
        kind: 'bytesTypeNode',
    });
}
