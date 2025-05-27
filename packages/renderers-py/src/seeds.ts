import { BytesValueNode, PdaSeedNode } from '@codama/nodes';

import { HexToPyB } from './getTypeManifestVisitor';

// function hexToString(hex: string): string {
//     hex = hex.replace(/^0x/i, '');
//     if (hex.length % 2 !== 0) {
//         throw new Error('Invalid hex string: length must be even');
//     }

//     let result = '';
//     for (let i = 0; i < hex.length; i += 2) {
//         const hexPair = hex.substring(i, i + 2);
//         const charCode = parseInt(hexPair, 16);
//         result += String.fromCharCode(charCode);
//     }

//     return result;
// }
export function getSeed(seed: PdaSeedNode): string {
    if (seed.kind == 'constantPdaSeedNode') {
        if (seed.type.kind == 'bytesTypeNode') {
            const hexStr = HexToPyB((seed.value as BytesValueNode).data); //hexToString((seed.value as BytesValueNode).data);
            return `b"${hexStr}"`;
        }
        return '';
    } else if (seed.kind == 'variablePdaSeedNode') {
        if (seed.type.kind == 'publicKeyTypeNode') {
            return `bytes(${seed.name})`;
        }
        return '';
    }
    return '';
}
export function getSeedType(seed: PdaSeedNode): string {
    if (seed.kind == 'variablePdaSeedNode') {
        if (seed.type.kind == 'publicKeyTypeNode') {
            return 'Pubkey';
        }
        return '';
    }
    return '';
}
