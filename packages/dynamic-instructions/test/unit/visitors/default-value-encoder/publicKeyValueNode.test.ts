import { getAddressCodec } from '@solana/addresses';
import { publicKeyTypeNode, publicKeyValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './default-value-encoder-test-utils';

describe('default-value-encoder: visitPublicKeyValue', () => {
    test('should encode public key as 32 bytes', () => {
        const pubkey = SvmTestContext.generateAddress();
        const visitor = makeVisitor(publicKeyTypeNode());
        const result = visitor.visitPublicKeyValue(publicKeyValueNode(pubkey));
        expect(result).toEqual(getAddressCodec().encode(pubkey));
        expect(result.length).toBe(32);
    });

    test('should throw for invalid public key', () => {
        const invalidPubkey = 'not-a-valid-pubkey';
        const visitor = makeVisitor(publicKeyTypeNode());
        expect(() => visitor.visitPublicKeyValue(publicKeyValueNode(invalidPubkey))).toThrow();
    });
});
