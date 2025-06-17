import { BytesValueNode, PdaSeedNode } from '@codama/nodes';

import { hexToPyB } from './getTypeManifestVisitor';
function parseUNumber(str: string): number {
    // Remove 'u' prefix and convert to number
    return parseInt(str.replace(/^u/, ''), 10);
}
export function getSeed(seed: PdaSeedNode): string {
    if (seed.kind == 'constantPdaSeedNode') {
        if (seed.type.kind == 'bytesTypeNode') {
            const hexStr = hexToPyB((seed.value as BytesValueNode).data); //hexToString((seed.value as BytesValueNode).data);
            return `b"${hexStr}"`;
        }
        return '';
    } else if (seed.kind == 'variablePdaSeedNode') {
        if (seed.type.kind == 'publicKeyTypeNode') {
            return `bytes(${seed.name})`;
        }
        if (seed.type.kind == 'numberTypeNode') {
            if (
                seed.type.format == 'u16' ||
                seed.type.format == 'u8' ||
                seed.type.format == 'u32' ||
                seed.type.format == 'u64' ||
                seed.type.format == 'u128'
            ) {
                const length = parseUNumber(seed.type.format) / 8;
                return `${seed.name}.to_bytes(${length}, byteorder='little')`;
            }
        }
        return '';
    }
    return '';
}
export function getSeedType(seed: PdaSeedNode): string {
    if (seed.kind == 'variablePdaSeedNode') {
        if (seed.type.kind == 'publicKeyTypeNode') {
            return 'SolPubkey';
        }
        if (seed.type.kind == 'numberTypeNode') {
            return 'int';
        }
        return '';
    }
    return '';
}
