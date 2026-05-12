import { payerValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { generateAddress } from '../../test-utils';
import { makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitPayerValue', () => {
    test('should return provided address', async () => {
        const addr = await generateAddress();
        const visitor = makeVisitor({ accountsInput: { testAccount: addr } });
        const result = await visitor.visitPayerValue(payerValueNode());
        expect(result).toBe(addr);
    });

    test('should throw when address not provided (undefined)', async () => {
        const visitor = makeVisitor({ accountsInput: { testAccount: undefined } });
        await expect(visitor.visitPayerValue(payerValueNode())).rejects.toThrow(/Missing account \[testAccount\]/);
    });

    test('should throw when address not provided (null)', async () => {
        const visitor = makeVisitor({ accountsInput: { testAccount: null } });
        await expect(visitor.visitPayerValue(payerValueNode())).rejects.toThrow(/Missing account \[testAccount\]/);
    });
});
