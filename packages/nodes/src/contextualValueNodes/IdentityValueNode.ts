import type { IdentityValueNode } from '@kinobi-so/node-types';

export function identityValueNode(): IdentityValueNode {
    return Object.freeze({ kind: 'identityValueNode' });
}
