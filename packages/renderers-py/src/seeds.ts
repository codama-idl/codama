import { BytesValueNode, PdaSeedNode } from '@codama/nodes';

import { hexToPyB } from './getTypeManifestVisitor';
function parseUNumber(str: string): number {
    // Remove 'u' prefix and convert to number
    const parsed = parseInt(str.replace(/^u/, ''), 10);
    if (isNaN(parsed) || parsed < 0) {
        throw new Error(`Invalid unsigned number format: ${str}`);
    }
    return parsed;
}
export function getSeed(seed: PdaSeedNode): string {
    try {
        if (seed.kind === 'constantPdaSeedNode') {
            if (seed.type.kind === 'bytesTypeNode') {
                const hexStr = hexToPyB((seed.value as BytesValueNode).data);
                return `b"${hexStr}"`;
            }
            return '';
        } else if (seed.kind === 'variablePdaSeedNode') {
            if (seed.type.kind === 'publicKeyTypeNode') {
                return `bytes(${seed.name})`;
            }
            if (seed.type.kind === 'numberTypeNode') {
                const supportedFormats = ['u8', 'u16', 'u32', 'u64', 'u128'];
                if (supportedFormats.includes(seed.type.format)) {
                    const length = parseUNumber(seed.type.format) / 8;
                    return `${seed.name}.to_bytes(${length}, byteorder='little')`;
                }
            }
            return '';
        }
        return '';
    } catch (error) {
        console.warn(`Error generating seed for ${seed.kind}:`, error);
        return '';
    }
}
export function getSeedType(seed: PdaSeedNode): string {
    if (seed.kind === 'variablePdaSeedNode') {
        switch (seed.type.kind) {
            case 'publicKeyTypeNode':
                return 'SolPubkey';
            case 'numberTypeNode':
                return 'int';
            case 'stringTypeNode':
                return 'str';
            case 'bytesTypeNode':
                return 'bytes';
            default:
                console.warn(`Unsupported seed type: ${seed.type.kind}`);
                return 'typing.Any';
        }
    }
    return '';
}
