/** The wire format of a numeric serialization. */
export type NumberFormat =
    /** IEEE-754 32-bit floating point. */
    | 'f32'
    /** IEEE-754 64-bit floating point. */
    | 'f64'
    /** Signed 128-bit integer. */
    | 'i128'
    /** Signed 16-bit integer. */
    | 'i16'
    /** Signed 32-bit integer. */
    | 'i32'
    /** Signed 64-bit integer. */
    | 'i64'
    /** Signed 8-bit integer. */
    | 'i8'
    /** Solana compact-u16 encoding: a variable-length unsigned integer occupying 1 to 3 bytes. */
    | 'shortU16'
    /** Unsigned 128-bit integer. */
    | 'u128'
    /** Unsigned 16-bit integer. */
    | 'u16'
    /** Unsigned 32-bit integer. */
    | 'u32'
    /** Unsigned 64-bit integer. */
    | 'u64'
    /** Unsigned 8-bit integer. */
    | 'u8';
