import type { BytesTypeNode } from '@codama/node-types';

export function bytesTypeNode(): BytesTypeNode {
    return Object.freeze({ kind: 'bytesTypeNode' });
}
