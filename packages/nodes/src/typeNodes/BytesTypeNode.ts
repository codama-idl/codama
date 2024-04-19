import type { BytesTypeNode } from '@kinobi-so/node-types';

export function bytesTypeNode(): BytesTypeNode {
    return Object.freeze({ kind: 'bytesTypeNode' });
}
