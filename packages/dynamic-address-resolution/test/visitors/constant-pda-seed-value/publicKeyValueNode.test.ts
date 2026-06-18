import { address, getAddressEncoder } from '@solana/addresses';
import { publicKeyValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { generateAddress } from '../../test-utils';
import { makeConstantVisitor } from './constant-pda-seed-value-test-utils';

describe('constant-pda-seed-value: visitPublicKeyValue', () => {
    test('should encode the provided public key as 32-byte address', async () => {
        const randomAddress = await generateAddress();
        const result = await makeConstantVisitor().visitPublicKeyValue(publicKeyValueNode(randomAddress));
        expect(result).toEqual(getAddressEncoder().encode(address(randomAddress)));
    });

    test('should throw for invalid public key', async () => {
        await expect(makeConstantVisitor().visitPublicKeyValue(publicKeyValueNode('not-a-key'))).rejects.toThrow(
            /Cannot convert value to Address/,
        );
    });
});
