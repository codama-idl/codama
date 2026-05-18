import { identityValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { generateAddress } from '../../test-utils';
import { makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitIdentityValue', () => {
    test('should return provided address', async () => {
        const addr = await generateAddress();
        const visitor = makeVisitor({ accountsInput: { testAccount: addr } });
        const result = await visitor.visitIdentityValue(identityValueNode());
        expect(result).toBe(addr);
    });

    test('should throw when address not provided (undefined)', async () => {
        const visitor = makeVisitor({ accountsInput: { testAccount: undefined } });
        await expect(visitor.visitIdentityValue(identityValueNode())).rejects.toThrow(
            /Missing account \[testAccount\]/,
        );
    });

    test('should throw when address not provided (null)', async () => {
        const visitor = makeVisitor({ accountsInput: { testAccount: null } });
        await expect(visitor.visitIdentityValue(identityValueNode())).rejects.toThrow(
            /Missing account \[testAccount\]/,
        );
    });
});
