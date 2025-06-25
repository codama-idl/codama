import { BytesValueNode } from '@codama/nodes';

// Base58 alphabet used by Bitcoin and Solana
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeUtf8(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}

function encodeBase16(hex: string): Uint8Array {
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
}

function encodeBase58(str: string): Uint8Array {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
        let carry = BASE58_ALPHABET.indexOf(str[i]);
        if (carry === -1) {
            throw new Error(`Invalid base58 character: ${str[i]}`);
        }
        for (let j = 0; j < bytes.length; j++) {
            carry += bytes[j] * 58;
            bytes[j] = carry & 0xff;
            carry >>= 8;
        }
        while (carry > 0) {
            bytes.push(carry & 0xff);
            carry >>= 8;
        }
    }

    // Count leading zeros
    let leadingZeros = 0;
    for (let i = 0; i < str.length && str[i] === '1'; i++) {
        leadingZeros++;
    }

    const result = new Uint8Array(leadingZeros + bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        result[leadingZeros + i] = bytes[bytes.length - 1 - i];
    }

    return result;
}

function encodeBase64(str: string): Uint8Array {
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Number encoding functions
export function encodeU8(value: number): Uint8Array {
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);
    view.setUint8(0, value);
    return new Uint8Array(buffer);
}

export function encodeU16(value: number): Uint8Array {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint16(0, value, true); // little endian
    return new Uint8Array(buffer);
}

export function encodeU32(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, value, true); // little endian
    return new Uint8Array(buffer);
}

export function encodeU64(value: number): Uint8Array {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(value), true); // little endian
    return new Uint8Array(buffer);
}

export function getBytesFromBytesValueNode(node: BytesValueNode): Uint8Array {
    switch (node.encoding) {
        case 'utf8':
            return encodeUtf8(node.data);
        case 'base16':
            return encodeBase16(node.data);
        case 'base58':
            return encodeBase58(node.data);
        case 'base64':
        default:
            return encodeBase64(node.data);
    }
}
