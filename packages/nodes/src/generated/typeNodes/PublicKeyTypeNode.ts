import type { PublicKeyTypeNode } from '@codama/node-types';

/** A 32-byte Solana public key. */
export function publicKeyTypeNode(): PublicKeyTypeNode {
    return Object.freeze({
        kind: 'publicKeyTypeNode',
    });
}
