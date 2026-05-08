/** A raw sequence of bytes. Typically used inside a fixed-size, size-prefixed, or sentinel-terminated wrapper. */
export interface BytesTypeNode {
    readonly kind: 'bytesTypeNode';
}
