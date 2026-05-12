import type { PublicKeyValueNode } from '@codama/node-types';
import { camelCase } from '../../shared';

/** A concrete public key, with an optional symbolic identifier for the address. */
export function publicKeyValueNode(publicKey: string, identifier?: string): PublicKeyValueNode {
    return Object.freeze({
        kind: 'publicKeyValueNode',

        // Data.
        publicKey,
        ...(identifier !== undefined && { identifier: camelCase(identifier) }),
    });
}
