import { identityValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitIdentityValue', () => {
    test('should return provided address', async () => {
        const addr = await SvmTestContext.generateAddress();
        const visitor = makeVisitor({ accountAddressInput: addr });
        const result = await visitor.visitIdentityValue(identityValueNode());
        expect(result).toBe(addr);
    });

    test('should throw when address not provided (undefined)', async () => {
        const visitor = makeVisitor({ accountAddressInput: undefined });
        await expect(visitor.visitIdentityValue(identityValueNode())).rejects.toThrow(
            /Missing account \[testAccount\]/,
        );
    });

    test('should throw when address not provided (null)', async () => {
        const visitor = makeVisitor({ accountAddressInput: null });
        await expect(visitor.visitIdentityValue(identityValueNode())).rejects.toThrow(
            /Missing account \[testAccount\]/,
        );
    });
});
