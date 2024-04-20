import type { PublicKeyTypeNode } from '@kinobi-so/node-types';

export function publicKeyTypeNode(): PublicKeyTypeNode {
    return Object.freeze({ kind: 'publicKeyTypeNode' });
}
