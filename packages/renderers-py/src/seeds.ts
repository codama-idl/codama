import { BytesValueNode, PdaSeedNode } from '@codama/nodes';

import { hexToPyB } from './getTypeManifestVisitor';

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
        return '';
    }
    return '';
}
export function getSeedType(seed: PdaSeedNode): string {
    if (seed.kind == 'variablePdaSeedNode') {
        if (seed.type.kind == 'publicKeyTypeNode') {
            return 'SolPubkey';
        }
        return '';
    }
    return '';
}
