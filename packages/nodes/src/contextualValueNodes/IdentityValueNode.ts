import type { IdentityValueNode } from '@codama/node-types';

export function identityValueNode(): IdentityValueNode {
    return Object.freeze({ kind: 'identityValueNode' });
}
