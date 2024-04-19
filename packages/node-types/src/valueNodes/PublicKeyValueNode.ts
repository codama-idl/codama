import type { CamelCaseString } from '../shared';

export interface PublicKeyValueNode {
    readonly kind: 'publicKeyValueNode';

    // Data.
    readonly publicKey: string;
    readonly identifier?: CamelCaseString;
}
