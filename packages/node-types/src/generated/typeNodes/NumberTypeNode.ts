import type { Endianness } from '../shared/endianness';
import type { NumberFormat } from '../shared/numberFormat';

/** A numeric type with a fixed wire format and byte order. */
export interface NumberTypeNode<TFormat extends NumberFormat = NumberFormat> {
    readonly kind: 'numberTypeNode';

    // Data.
    /** The wire format used to serialise the number. */
    readonly format: TFormat;
    /** The byte order used to serialise the number. */
    readonly endian: Endianness;
}
