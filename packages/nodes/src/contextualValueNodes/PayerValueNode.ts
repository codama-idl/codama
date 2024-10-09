import type { PayerValueNode } from '@codama/node-types';

export function payerValueNode(): PayerValueNode {
    return Object.freeze({ kind: 'payerValueNode' });
}
