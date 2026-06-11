import type { CamelCaseString } from '../../brands';

/** A concrete public key, with an optional symbolic identifier for the address. */
export interface PublicKeyValueNode {
    readonly kind: 'publicKeyValueNode';

    // Data.
    /** The base58-encoded public key. */
    readonly publicKey: string;
    /** A symbolic name for the address, useful in generated client code. */
    readonly identifier?: CamelCaseString;
}
