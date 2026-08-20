import type { BytesEncoding } from '../shared/bytesEncoding';

/** A concrete bytes value, encoded as text in the chosen encoding. */
export interface BytesValueNode {
    readonly kind: 'bytesValueNode';

    // Data.
    /** The bytes encoded as a text string per the `encoding` attribute. */
    readonly data: string;
    /** The encoding used to represent the bytes as text. */
    readonly encoding: BytesEncoding;
}
