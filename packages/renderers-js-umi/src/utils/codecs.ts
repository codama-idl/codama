import { BytesValueNode } from '@codama/nodes';
import { getBase16Encoder, getBase58Encoder, getBase64Encoder, getUtf8Encoder } from '@solana/codecs-strings';

export function getBytesFromBytesValueNode(node: BytesValueNode): Uint8Array {
    switch (node.encoding) {
        case 'utf8':
            return getUtf8Encoder().encode(node.data) as Uint8Array;
        case 'base16':
            return getBase16Encoder().encode(node.data) as Uint8Array;
        case 'base58':
            return getBase58Encoder().encode(node.data) as Uint8Array;
        case 'base64':
        default:
            return getBase64Encoder().encode(node.data) as Uint8Array;
    }
}
