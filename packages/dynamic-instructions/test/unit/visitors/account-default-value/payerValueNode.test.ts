import { payerValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitPayerValue', () => {
    test('should return provided address', async () => {
        const addr = await SvmTestContext.generateAddress();
        const visitor = makeVisitor({ accountAddressInput: addr });
        const result = await visitor.visitPayerValue(payerValueNode());
        expect(result).toBe(addr);
    });

    test('should throw when address not provided (undefined)', async () => {
        const visitor = makeVisitor({ accountAddressInput: undefined });
        await expect(visitor.visitPayerValue(payerValueNode())).rejects.toThrow(
            /Cannot resolve payer value for testAccount: account address not provided/,
        );
    });

    test('should throw when address not provided (null)', async () => {
        const visitor = makeVisitor({ accountAddressInput: null });
        await expect(visitor.visitPayerValue(payerValueNode())).rejects.toThrow(
            /Cannot resolve payer value for testAccount: account address not provided/,
        );
    });
});
