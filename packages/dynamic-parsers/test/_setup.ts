import { getBase16Encoder, ReadonlyUint8Array } from '@solana/codecs';

export function hex(hexadecimal: string): ReadonlyUint8Array {
    return getBase16Encoder().encode(hexadecimal);
}
