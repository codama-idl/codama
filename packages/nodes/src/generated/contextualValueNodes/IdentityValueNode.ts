import type { IdentityValueNode } from '@codama/node-types';

/**
 * Refers to the wallet identity providing the instruction context — the main wallet that should own things.
 * For instance, in a web application the identity would be the connected wallet; in a terminal, the wallet identified by `solana address`.
 * A similar node exists for the main wallet that should pay for things — `payerValueNode`. In practice the identity and the payer are often the same, but offering the distinction can be useful should they differ.
 */
export function identityValueNode(): IdentityValueNode {
    return Object.freeze({
        kind: 'identityValueNode',
    });
}
