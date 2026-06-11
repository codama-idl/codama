import type { IdentityValueNode } from '@codama/node-types';

/** Refers to the wallet identity providing the instruction context. */
export function identityValueNode(): IdentityValueNode {
    return Object.freeze({
        kind: 'identityValueNode',
    });
}
