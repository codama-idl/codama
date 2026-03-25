import { address, getAddressEncoder } from '@solana/addresses';
import { publicKeyValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitPublicKeyValue', () => {
    test('should encode the provided public key as 32-byte address', async () => {
        const svm = new SvmTestContext();
        const randomAddress = svm.createAccount();
        const result = await makeVisitor().visitPublicKeyValue(publicKeyValueNode(randomAddress));
        expect(result).toEqual(getAddressEncoder().encode(address(randomAddress)));
    });

    test('should throw for invalid public key', async () => {
        const invalidPublicKeys = [123, 'not-a-key', [1, 2, 3], null];
        const visitor = makeVisitor();

        for (const invalidPublicKey of invalidPublicKeys) {
            // @ts-expect-error testing invalid inputs
            await expect(visitor.visitPublicKeyValue(publicKeyValueNode(invalidPublicKey))).rejects.toThrow(
                /Expected base58-encoded Address/,
            );
        }
    });
});
