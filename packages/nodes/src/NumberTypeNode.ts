import type { NumberTypeNode } from '@codama/node-types';

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
