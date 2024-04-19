import type { PayerValueNode } from '@kinobi-so/node-types';

export function payerValueNode(): PayerValueNode {
    return Object.freeze({ kind: 'payerValueNode' });
}
