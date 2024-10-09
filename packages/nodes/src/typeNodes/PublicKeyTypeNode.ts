import type { PublicKeyTypeNode } from '@codama/node-types';

export function publicKeyTypeNode(): PublicKeyTypeNode {
    return Object.freeze({ kind: 'publicKeyTypeNode' });
}
