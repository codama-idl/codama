import type { Endianness, NumberFormat, NumberTypeNode } from '@codama/node-types';

/** A numeric type with a fixed wire format and byte order. */
export function numberTypeNode<const TFormat extends NumberFormat = NumberFormat>(
    format: TFormat,
    endian: Endianness = 'le',
): NumberTypeNode<TFormat> {
    return Object.freeze({
        kind: 'numberTypeNode',

        // Data.
        format,
        endian,
    });
}
