import type { NumberFormat, NumberTypeNode } from '@kinobi-so/node-types';

export function numberTypeNode<TFormat extends NumberFormat = NumberFormat>(
    format: TFormat,
    endian: 'be' | 'le' = 'le',
): NumberTypeNode<TFormat> {
    return Object.freeze({
        kind: 'numberTypeNode',

        // Data.
        format,
        endian,
    });
}

export function isSignedInteger(node: NumberTypeNode): boolean {
    return node.format.startsWith('i');
}

export function isUnsignedInteger(node: NumberTypeNode): boolean {
    return node.format.startsWith('u') || node.format === 'shortU16';
}

export function isInteger(node: NumberTypeNode): boolean {
    return !node.format.startsWith('f');
}

export function isDecimal(node: NumberTypeNode): boolean {
    return node.format.startsWith('f');
}
