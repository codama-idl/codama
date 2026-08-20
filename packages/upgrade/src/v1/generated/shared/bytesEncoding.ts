/** How a string of bytes is encoded for transport. */
export type BytesEncoding =
    /** Hexadecimal encoding (two characters per byte). */
    | 'base16'
    /** Base58 encoding, the standard for Solana addresses. */
    | 'base58'
    /** Base64 encoding (RFC 4648). */
    | 'base64'
    /** UTF-8 text encoding. */
    | 'utf8';
