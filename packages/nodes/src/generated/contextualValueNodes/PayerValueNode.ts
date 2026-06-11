import type { PayerValueNode } from '@codama/node-types';

/** Refers to the wallet paying for the surrounding transaction. */
export function payerValueNode(): PayerValueNode {
    return Object.freeze({
        kind: 'payerValueNode',
    });
}
