import type { Endianness, NumberDisplayNode, NumberFormat, NumberTypeNode } from '@codama/node-types';

/** A numeric type with a fixed wire format and byte order. */
export function numberTypeNode<
    const TFormat extends NumberFormat = NumberFormat,
    const TDisplay extends NumberDisplayNode | undefined = undefined,
>(
    format: TFormat,
    endian: Endianness = 'le',
    options: {
        display?: TDisplay;
    } = {},
): NumberTypeNode<TFormat, TDisplay> {
    return Object.freeze({
        kind: 'numberTypeNode',

        // Data.
        format,
        endian,

        // Children.
        ...(options.display !== undefined && { display: options.display }),
    });
}
