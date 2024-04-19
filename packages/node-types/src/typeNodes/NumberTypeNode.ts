export type NumberFormat =
    | 'f32'
    | 'f64'
    | 'i8'
    | 'i16'
    | 'i32'
    | 'i64'
    | 'i128'
    | 'shortU16'
    | 'u8'
    | 'u16'
    | 'u32'
    | 'u64'
    | 'u128';

export interface NumberTypeNode<TFormat extends NumberFormat = NumberFormat> {
    readonly kind: 'numberTypeNode';

    // Data.
    readonly format: TFormat;
    readonly endian: 'be' | 'le';
}
