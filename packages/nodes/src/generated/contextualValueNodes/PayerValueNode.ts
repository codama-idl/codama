import type { PayerValueNode } from '@codama/node-types';

/**
 * Refers to the wallet paying for the surrounding transaction — the main wallet that should pay for things, such as rent for account storage.
 * For instance, in a web application the payer would be the connected wallet; in a terminal, the wallet identified by `solana address`.
 * A similar node exists for the main wallet that should own things — `identityValueNode`. In practice the identity and the payer are often the same, but offering the distinction can be useful should they differ.
 */
export function payerValueNode(): PayerValueNode {
    return Object.freeze({
        kind: 'payerValueNode',
    });
}
